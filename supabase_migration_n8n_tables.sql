-- ============================================================
-- Tabelas auxiliares para o agente Andrézinho (LangGraph)
-- Compatíveis com o schema usado pelo n8n original — mantém coexistência
-- durante a migração. Use service-role no client para bypass de RLS.
-- ============================================================

-- 1. Fila de mensagens (debounce de 3s)
CREATE TABLE IF NOT EXISTS public.n8n_fila_mensagens (
    id BIGSERIAL PRIMARY KEY,
    id_mensagem TEXT NOT NULL,
    telefone TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fila_telefone_timestamp
    ON public.n8n_fila_mensagens (telefone, timestamp);

-- 2. Histórico de mensagens (LangChain memory)
-- Schema compatível com PostgresChatMessageHistory do langchain-community.
CREATE TABLE IF NOT EXISTS public.n8n_historico_mensagens (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_session_id
    ON public.n8n_historico_mensagens (session_id, created_at);

-- 3. Status de atendimento (lock distribuído + estado de follow-up)
CREATE TABLE IF NOT EXISTS public.n8n_status_atendimento (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    lock_conversa BOOLEAN NOT NULL DEFAULT FALSE,
    aguardando_followup BOOLEAN NOT NULL DEFAULT FALSE,
    numero_followup INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_aguardando_followup
    ON public.n8n_status_atendimento (aguardando_followup)
    WHERE aguardando_followup = TRUE;

-- 4. RLS desabilitado nessas tabelas (acessadas apenas via service role no servidor)
ALTER TABLE public.n8n_fila_mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_historico_mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_status_atendimento DISABLE ROW LEVEL SECURITY;

-- 5. Trigger para atualizar updated_at em n8n_status_atendimento
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_status_updated_at ON public.n8n_status_atendimento;
CREATE TRIGGER trg_status_updated_at
    BEFORE UPDATE ON public.n8n_status_atendimento
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();
