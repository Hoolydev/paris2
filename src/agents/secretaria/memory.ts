import {
    BaseMessage,
    mapChatMessagesToStoredMessages,
    mapStoredMessagesToChatMessages,
} from '@langchain/core/messages';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// ============================================================
// Histórico de conversa por telefone (session_id), persistido em
// n8n_historico_mensagens. Schema compatível com o LangChain memory
// usado pelo n8n (coluna `message` JSONB com StoredMessage).
// Serverless-safe: lê/grava via supabase service role (sem pool pg).
// ============================================================

const TABLE = 'n8n_historico_mensagens';
const MAX_HISTORY = 30; // últimas N mensagens carregadas no contexto

export async function loadHistory(sessionId: string): Promise<BaseMessage[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from(TABLE)
        .select('message')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

    if (error) {
        logger.error({ error: error.message, sessionId }, 'Erro ao carregar histórico');
        return [];
    }
    const stored = (data || [])
        .map((row: any) => row.message)
        .reverse(); // volta à ordem cronológica
    try {
        return mapStoredMessagesToChatMessages(stored);
    } catch (err) {
        logger.error({ err: String(err) }, 'Erro ao desserializar histórico');
        return [];
    }
}

export async function appendMessages(
    sessionId: string,
    messages: BaseMessage[]
): Promise<void> {
    if (!messages.length) return;
    const supabase = getSupabaseAdmin();
    const stored = mapChatMessagesToStoredMessages(messages);
    const rows = stored.map((message) => ({ session_id: sessionId, message }));
    const { error } = await supabase.from(TABLE).insert(rows);
    if (error) {
        logger.error({ error: error.message, sessionId }, 'Erro ao salvar histórico');
    }
}

export async function clearHistory(sessionId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq('session_id', sessionId);
    if (error) {
        logger.error({ error: error.message, sessionId }, 'Erro ao limpar histórico');
    }
}
