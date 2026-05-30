import { selectByPhone, deleteByPhone } from './message-queue';
import { tryLock, release } from './attendance-lock';
import { enviarResposta } from './send-message';
import { runSecretaria } from '@/agents/secretaria/graph';
import { getContactCustomAttributes, markAsRead, sendMessage } from '@/lib/chatwoot';
import { logger } from '@/lib/logger';

// ============================================================
// Orquestração pós-webhook (executada via next/after, em background).
// Replica os padrões críticos do n8n: debounce de 3s, detecção de
// "mensagem encavalada" e lock distribuído.
// ============================================================

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '3000', 10);

export interface ProcessContext {
    telefone: string;
    idMensagem: string;
    idConversa: number | string;
    idContato: number | string;
}

export async function runDebouncedProcessing(ctx: ProcessContext): Promise<void> {
    const { telefone, idMensagem, idConversa, idContato } = ctx;

    // 1. Debounce: espera para agrupar mensagens consecutivas.
    await sleep(DEBOUNCE_MS);

    // 2. Lê a fila do telefone.
    const fila = await selectByPhone(telefone);
    if (!fila.length) {
        logger.info({ telefone }, 'Fila vazia após debounce — ignorando');
        return;
    }

    // 3. Detecção de "mensagem encavalada": se chegou mensagem mais nova que
    //    a desta invocação, deixamos a invocação dela cuidar de tudo.
    const ultima = fila[fila.length - 1];
    if (ultima.id_mensagem !== idMensagem) {
        logger.info(
            { telefone, idMensagem, ultima: ultima.id_mensagem },
            'Mensagem encavalada — esta invocação encerra'
        );
        return;
    }

    // 4. Lock distribuído.
    const gotLock = await tryLock(telefone);
    if (!gotLock) {
        logger.info({ telefone }, 'Conversa já em processamento — encerrando');
        return;
    }

    try {
        // 5. Consome a fila e concatena.
        const mensagemConcatenada = fila.map((m) => m.mensagem).join('\n').trim();
        await deleteByPhone(telefone);

        // 6. Marca como lida no Chatwoot.
        await markAsRead(idConversa);

        // 7. Lê preferência audio/texto do contato.
        let preferencia: 'audio' | 'texto' | 'ambos' = 'ambos';
        try {
            const attrs = await getContactCustomAttributes(idContato);
            const p = attrs?.preferencia_audio_texto;
            if (p === 'audio' || p === 'texto' || p === 'ambos') preferencia = p;
        } catch {
            /* mantém 'ambos' */
        }

        // 8. Invoca o agente.
        const resposta = await runSecretaria({
            telefone,
            idConversa,
            idContato,
            idMensagem,
            idAgenda: process.env.GOOGLE_CALENDAR_AGENDA_ID || '',
            mensagem: mensagemConcatenada,
            preferenciaAudioTexto: preferencia,
        });

        // 9. Envia a resposta (se houver — algumas ações são só via tools).
        if (resposta) {
            await enviarResposta(idConversa, resposta);
        }
    } catch (err) {
        logger.error({ err: String(err), telefone }, 'Erro no processamento do agente');
        // Nunca expor erro técnico ao cliente; mensagem genérica de fallback.
        try {
            await sendMessage(
                idConversa,
                'Opa, tive um probleminha aqui no sistema. Já já te respondo, beleza?'
            );
        } catch {
            /* ignora */
        }
    } finally {
        await release(telefone);
    }
}
