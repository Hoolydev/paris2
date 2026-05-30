import { getSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// ============================================================
// Lock distribuído por conversa (n8n_status_atendimento.lock_conversa).
// Evita que duas invocações concorrentes processem o mesmo telefone.
// Implementado como UPDATE condicional atômico (compare-and-set).
// ============================================================

const TABLE = 'n8n_status_atendimento';

async function ensureRow(sessionId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    // upsert idempotente da linha de status (sem mexer no lock se já existir)
    await supabase
        .from(TABLE)
        .upsert({ session_id: sessionId }, { onConflict: 'session_id', ignoreDuplicates: true });
}

// Tenta adquirir o lock. Retorna true se conseguiu, false se já está travado.
export async function tryLock(sessionId: string): Promise<boolean> {
    await ensureRow(sessionId);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from(TABLE)
        .update({ lock_conversa: true })
        .eq('session_id', sessionId)
        .eq('lock_conversa', false)
        .select('id');
    if (error) {
        logger.error({ error: error.message, sessionId }, 'Erro ao adquirir lock');
        return false;
    }
    return (data || []).length > 0;
}

export async function release(sessionId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from(TABLE)
        .update({ lock_conversa: false })
        .eq('session_id', sessionId);
    if (error) logger.error({ error: error.message, sessionId }, 'Erro ao liberar lock');
}

// Marca o lead como aguardando follow-up (consumido pelo cron futuro).
export async function markPendingFollowup(sessionId: string): Promise<void> {
    await ensureRow(sessionId);
    const supabase = getSupabaseAdmin();
    await supabase
        .from(TABLE)
        .update({ aguardando_followup: true })
        .eq('session_id', sessionId);
}

export async function clearStatus(sessionId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from(TABLE).delete().eq('session_id', sessionId);
}
