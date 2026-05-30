import { getSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// ============================================================
// Fila de mensagens (n8n_fila_mensagens) — base do debounce de 3s.
// Cada mensagem recebida é enfileirada; após o debounce, todas as
// mensagens do telefone são concatenadas e processadas de uma vez.
// ============================================================

const TABLE = 'n8n_fila_mensagens';

export interface FilaMensagem {
    id: number;
    id_mensagem: string;
    telefone: string;
    mensagem: string;
    timestamp: string;
}

export async function enqueue(
    telefone: string,
    idMensagem: string,
    mensagem: string
): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert({
        telefone,
        id_mensagem: idMensagem,
        mensagem,
    });
    if (error) logger.error({ error: error.message }, 'Erro ao enfileirar mensagem');
}

export async function selectByPhone(telefone: string): Promise<FilaMensagem[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('telefone', telefone)
        .order('timestamp', { ascending: true });
    if (error) {
        logger.error({ error: error.message }, 'Erro ao ler fila');
        return [];
    }
    return (data || []) as FilaMensagem[];
}

export async function deleteByPhone(telefone: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq('telefone', telefone);
    if (error) logger.error({ error: error.message }, 'Erro ao limpar fila');
}
