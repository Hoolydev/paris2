import { clearHistory } from '@/agents/secretaria/memory';
import { deleteByPhone } from './message-queue';
import { clearStatus } from './attendance-lock';
import {
    sendMessage,
    removeConversationLabel,
    addConversationLabel,
    destroyContactAttributes,
} from '@/lib/chatwoot';
import { logger } from '@/lib/logger';

// Comandos especiais replicados do n8n (case-insensitive).

const RESET_ATTRS = [
    'preferencia_audio_texto',
    'asaas_id_cliente',
    'asaas_id_cobranca',
    'asaas_status_cobranca',
];

export function detectCommand(conteudo: string): 'reset' | 'teste' | null {
    const t = conteudo.trim().toLowerCase();
    if (t === '/reset') return 'reset';
    if (t === '/teste') return 'teste';
    return null;
}

export async function handleReset(ctx: {
    telefone: string;
    idConversa: number | string;
    idContato: number | string;
}): Promise<void> {
    logger.info({ telefone: ctx.telefone }, 'Comando /reset');
    await Promise.allSettled([
        clearHistory(ctx.telefone),
        deleteByPhone(ctx.telefone),
        clearStatus(ctx.telefone),
        removeConversationLabel(ctx.idConversa, 'agente-off'),
        destroyContactAttributes(ctx.idContato, RESET_ATTRS),
    ]);
    await sendMessage(ctx.idConversa, 'Memória resetada.');
}

export async function handleTeste(ctx: {
    idConversa: number | string;
}): Promise<void> {
    logger.info({ idConversa: ctx.idConversa }, 'Comando /teste');
    await addConversationLabel(ctx.idConversa, 'testando-agente');
    await sendMessage(ctx.idConversa, 'Modo de teste habilitado.');
}
