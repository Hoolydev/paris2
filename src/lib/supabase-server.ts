import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client server-side com service role — bypassa RLS nas tabelas n8n_*.
// Usar SOMENTE no servidor (route handlers, services). Nunca expor no client.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    _client = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return _client;
}
