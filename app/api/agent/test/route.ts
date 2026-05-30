import { NextRequest, NextResponse } from 'next/server';
import { runSecretaria } from '@/agents/secretaria/graph';
import { logger } from '@/lib/logger';

// Endpoint de teste do agente SEM passar pelo Chatwoot.
// Invoca o grafo diretamente e retorna a resposta como JSON.
// Protegido por CRON_SECRET (header x-test-secret ou ?secret=).

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== 'production'; // dev livre, prod exige secret
    const provided =
        request.headers.get('x-test-secret') ||
        new URL(request.url).searchParams.get('secret');
    return provided === secret;
}

export async function POST(request: NextRequest) {
    if (!authorized(request)) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
    }

    const telefone = String(body.telefone || 'teste-local');
    const mensagem = String(body.mensagem || '');
    if (!mensagem) {
        return NextResponse.json({ ok: false, error: 'campo "mensagem" obrigatório' }, { status: 400 });
    }

    try {
        const resposta = await runSecretaria({
            telefone,
            idConversa: body.idConversa ?? 0,
            idContato: body.idContato ?? 0,
            idMensagem: String(body.idMensagem ?? Date.now()),
            idAgenda: process.env.GOOGLE_CALENDAR_AGENDA_ID || '',
            mensagem,
            preferenciaAudioTexto: 'ambos',
        });
        return NextResponse.json({ ok: true, resposta });
    } catch (err) {
        logger.error({ err: String(err) }, 'Erro no /api/agent/test');
        return NextResponse.json(
            { ok: false, error: String(err) },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        uso: 'POST { telefone, mensagem } com header x-test-secret: <CRON_SECRET>',
    });
}
