import { getCalendarClient } from './google-auth';
import { logger } from './logger';

// ============================================================
// Helpers do Google Calendar para o agente de agendamento de visitas.
// Substitui os sub-workflows 03 (buscar janelas) e 04 (criar evento).
// Timezone fixo em America/Sao_Paulo (Goianésia-GO).
// ============================================================

export const TIMEZONE = 'America/Sao_Paulo';

function durationMin(): number {
    return parseInt(process.env.AGENDAMENTO_DURACAO_MINUTOS || '30', 10);
}

// Horário de atendimento por dia da semana (0=domingo ... 6=sábado).
// Override via env BUSINESS_HOURS_JSON (ex: {"1":["08:00","18:00"],...}).
function businessHours(): Record<number, [string, string] | null> {
    const raw = process.env.BUSINESS_HOURS_JSON;
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            logger.warn('BUSINESS_HOURS_JSON inválido — usando padrão.');
        }
    }
    return {
        0: null, // domingo fechado
        1: ['08:00', '18:00'],
        2: ['08:00', '18:00'],
        3: ['08:00', '18:00'],
        4: ['08:00', '18:00'],
        5: ['08:00', '18:00'],
        6: ['08:00', '12:00'], // sábado meio período
    };
}

// Offset fixo de Brasília (-03:00). Goianésia não tem horário de verão.
const BR_OFFSET = '-03:00';

function isoWithOffset(dateYmd: string, hm: string): string {
    return `${dateYmd}T${hm}:00${BR_OFFSET}`;
}

function ymd(date: Date): string {
    // Formata em America/Sao_Paulo
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function weekdayInTZ(date: Date): number {
    const wd = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        weekday: 'short',
    }).format(date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
}

export interface Slot {
    inicio: string; // ISO com offset
    fim: string;
    label: string; // legível em pt-BR
}

// Gera janelas livres entre periodoInicio e periodoFim, dentro do horário
// comercial, excluindo períodos ocupados (freebusy). Retorna até `amostras`.
export async function buscarJanelas(
    idAgenda: string,
    periodoInicioISO: string,
    periodoFimISO: string,
    amostras = 3
): Promise<Slot[]> {
    const calendar = getCalendarClient();
    const dur = durationMin();
    const hours = businessHours();

    const inicio = new Date(periodoInicioISO);
    const fim = new Date(periodoFimISO);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        throw new Error('Período inválido para buscar janelas.');
    }

    // Busca períodos ocupados via freebusy.
    const fb = await calendar.freebusy.query({
        requestBody: {
            timeMin: inicio.toISOString(),
            timeMax: fim.toISOString(),
            timeZone: TIMEZONE,
            items: [{ id: idAgenda }],
        },
    });
    const busy = (fb.data.calendars?.[idAgenda]?.busy || []).map((b) => ({
        start: new Date(b.start!).getTime(),
        end: new Date(b.end!).getTime(),
    }));

    const slots: Slot[] = [];
    const now = Date.now();

    // Itera dia a dia entre início e fim.
    const cursor = new Date(inicio);
    cursor.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= fim.getTime() && slots.length < amostras * 4) {
        const day = ymd(cursor);
        const wd = weekdayInTZ(cursor);
        const bh = hours[wd];
        if (bh) {
            const [openH, openM] = bh[0].split(':').map(Number);
            const [closeH, closeM] = bh[1].split(':').map(Number);
            const dayOpen = new Date(isoWithOffset(day, bh[0])).getTime();
            const dayClose = new Date(isoWithOffset(day, bh[1])).getTime();

            for (
                let t = dayOpen;
                t + dur * 60000 <= dayClose;
                t += 30 * 60000 // candidatos a cada 30 min
            ) {
                const slotStart = t;
                const slotEnd = t + dur * 60000;
                if (slotStart < now) continue; // não oferecer no passado
                if (slotStart < inicio.getTime() || slotEnd > fim.getTime()) continue;
                const conflita = busy.some(
                    (b) => slotStart < b.end && slotEnd > b.start
                );
                if (conflita) continue;
                slots.push({
                    inicio: new Date(slotStart).toISOString(),
                    fim: new Date(slotEnd).toISOString(),
                    label: formatSlotLabel(new Date(slotStart)),
                });
                if (slots.length >= amostras) break;
            }
        }
        if (slots.length >= amostras) break;
        cursor.setDate(cursor.getDate() + 1);
    }

    return slots.slice(0, amostras);
}

function formatSlotLabel(d: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: TIMEZONE,
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

export async function listarAgendamentosContato(
    idAgenda: string,
    telefone: string
): Promise<Array<{ id: string; titulo: string; inicio: string; descricao: string }>> {
    const calendar = getCalendarClient();
    const res = await calendar.events.list({
        calendarId: idAgenda,
        q: telefone,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    });
    return (res.data.items || []).map((e) => ({
        id: e.id!,
        titulo: e.summary || '',
        inicio: e.start?.dateTime || e.start?.date || '',
        descricao: e.description || '',
    }));
}

export async function criarEvento(
    idAgenda: string,
    params: { titulo: string; descricao: string; eventoInicioISO: string }
): Promise<{ id: string; htmlLink: string; meetLink?: string; inicio: string }> {
    const calendar = getCalendarClient();
    const dur = durationMin();
    const start = new Date(params.eventoInicioISO);
    const end = new Date(start.getTime() + dur * 60000);

    const res = await calendar.events.insert({
        calendarId: idAgenda,
        conferenceDataVersion: 1,
        requestBody: {
            summary: params.titulo,
            description: params.descricao,
            start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
            end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
            conferenceData: {
                createRequest: {
                    requestId: `paris-${start.getTime()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        },
    });

    return {
        id: res.data.id!,
        htmlLink: res.data.htmlLink || '',
        meetLink: res.data.hangoutLink || undefined,
        inicio: res.data.start?.dateTime || '',
    };
}

export async function atualizarEvento(
    idAgenda: string,
    idEvento: string,
    params: { titulo?: string; descricao?: string }
): Promise<void> {
    const calendar = getCalendarClient();
    await calendar.events.patch({
        calendarId: idAgenda,
        eventId: idEvento,
        requestBody: {
            ...(params.titulo !== undefined ? { summary: params.titulo } : {}),
            ...(params.descricao !== undefined ? { description: params.descricao } : {}),
        },
    });
}

export async function cancelarEvento(idAgenda: string, idEvento: string): Promise<void> {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: idAgenda, eventId: idEvento });
}
