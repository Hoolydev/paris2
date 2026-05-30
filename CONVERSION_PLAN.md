# Plano de Conversão: n8n → LangGraph (Next.js + Vercel)

> **Objetivo**: Substituir os 7 workflows n8n da Paris Imóveis por um aplicativo LangGraph nativo em **TypeScript** dentro do projeto Next.js 16 existente, mantendo o deploy na **Vercel** e o Supabase já configurado.

---

## 1. Contexto & Decisões Arquiteturais

### 1.1 Constraint principal — Vercel Serverless
O skill padrão da conversão n8n→LangGraph assume um servidor longo (Bun + ElysiaJS). Este projeto roda em **Vercel serverless** (Next.js 16 App Router). Isso muda fundamentalmente:

| Padrão n8n | Padrão skill (Bun) | Adaptação Vercel/Next.js |
|---|---|---|
| `Wait 3s` (debounce de mensagem) | `await sleep(3000)` | `import { after } from 'next/server'` — executa após resposta, dentro da mesma invocação. `maxDuration = 60` na route. |
| `Schedule Trigger` (cron 1min) | Processo background | `vercel.json` com `crons` → `/api/cron/followup` |
| Postgres lock loop com polling | `setInterval` | `pg_try_advisory_lock` em transação Supabase |
| Servidor persistente | `bun --hot` | `next dev` / `vercel dev` |
| `bun add` | `bun add` | **`npm install`** |
| Memória in-process | OK | NÃO usar — toda função é stateless |

### 1.2 Stack Final
- **Next.js 16 App Router** (existente)
- **TypeScript** (existente)
- **`@langchain/langgraph`** + **`@langchain/openai`** + **`@langchain/core`**
- **`@langchain/community`** (PostgresChatMessageHistory)
- **Supabase Postgres** como state store, queue, locks e memory
- **Vercel Cron** para o agente de follow-up
- **`next/after`** para debounce de 3s sem queue externa
- **Service Account** Google para Calendar (substituindo OAuth do n8n)
- **Langfuse** para tracing/cost
- **Pino** para logging estruturado
- **`maxDuration = 60`** nos route handlers (requer Vercel Pro)

### 1.3 Por que não Bun / ElysiaJS / Python?
- O projeto já está em Next.js 16 + Vercel. Reescrever o front + back em Bun quebra o deploy atual.
- A Vercel não suporta long-running processes. `next/after` resolve elegantemente o caso de debounce.
- TypeScript + LangChain.js tem paridade quase completa com Python LangChain para este caso de uso.

### 1.4 Trade-offs aceitos
- **Áudio TTS desabilitado por default** (`ENABLE_AUDIO_RESPONSES=false`). O fluxo ElevenLabs do n8n está disabled no JSON original. Reativar requer validação de voz (atualmente "Harry - Fierce Warrior" — provável bug do n8n).
- **Sub-workflow `02 Google Drive` removido** — o `GUIA_ALTERACOES_N8N.md` já migrou para Supabase Storage. Manteremos só a versão Supabase.
- **Pré-flight check de disponibilidade no `Criar agendamento`** mantido como função interna (não como sub-graph) — mais simples em código nativo.

---

## 2. Inventário Consolidado (extraído dos 7 workflows)

### 2.1 Workflow principal — "01. Secretária v3" (paris.json)
- **Trigger**: webhook Chatwoot `POST /webhook/chatwoot`
- **Agente AI**: GPT-4.1 com 12 tools
- **System prompt**: `Workflows/SYSTEM_PROMPT_ANDREZINHO.md` (versão canônica, ~16 KB, contém placeholders `{{ $now... }}` e `{{ $('Info').item.json.* }}`)
- **Memory**: `n8n_historico_mensagens` (PostgresChatMessageHistory) com `session_id = telefone`
- **Padrões críticos**:
  - Debounce de 3s via fila `n8n_fila_mensagens`
  - Detecção de "mensagem encavalada" (compara último id_mensagem)
  - Lock distribuído em `n8n_status_atendimento.lock_conversa`
  - Comandos especiais `/reset` e `/teste`
  - Roteamento texto/áudio/arquivo
  - Pós-processamento por tipo de resposta (formatação texto vs SSML)
  - Quebra de mensagens longas em chunks
- **Bugs detectados no n8n original**:
  - `url_api` referenciada por `Buscar imóveis` mas **não definida** no nó Info
  - `tipo_arquivo` referenciada no input do agente mas variável correta é `info_arquivo`
  - Nó ElevenLabs **disabled** → fluxo de áudio quebrado
  - System prompt menciona `Enviar_foto_imovel` e `Escalar_humano` mas não estão como tools no JSON
  - Workflow 13 tem `tipo_follow_ups` com 2 elementos para 3 follow-ups (último cai em `undefined`)

### 2.2 Sub-workflows
| ID n8n | Nome | Função |
|---|---|---|
| `9hOppaD3AZGdpXBF` | 02 - Imagem Supabase | Baixa URL pública e envia como attachment ao Chatwoot |
| `APEaKg71r27npR4T` | 03 - Buscar janelas | Calcula slots livres no Google Calendar com disponibilidade hardcoded |
| `fDGrSYimen20WZN0` | 04 - Criar evento | Cria evento + Meet (com pré-flight via 03) |
| `tzp8GXgTxmctzlb4` | 04.1 - Atualizar evento | Patch título/descrição (sem mudar horário) |
| `2foZEVbIFUdj0RQf` | 07 - Quebrar mensagens | Split LLM + envio com typing indicator e delays |

### 2.3 Workflow 13 — Recuperação de Leads (follow-up)
- **Trigger**: schedule 1 min
- **Persona**: "Maria, secretária virtual" — **prompt da clínica antiga, precisa ser reescrito para Paris Imóveis** (Andrézinho follow-up)
- **Lógica**: array `follow_ups_horas = [6, 24, 48]` × `max_followups = 3`
- **Tipos**: `mensagem`, `ligacao_whatsapp`, `ligacao` (apenas `mensagem` será implementado no LangGraph — ligações via Twilio ficam fora do escopo desta conversão)

### 2.4 Tabelas Postgres (criadas/usadas)
```sql
-- Já usadas pelo n8n, manteremos compatibilidade:
n8n_fila_mensagens (id, id_mensagem, telefone, mensagem, timestamp)
n8n_historico_mensagens (id, session_id, message JSONB, created_at)
n8n_status_atendimento (id, session_id, lock_conversa, aguardando_followup, numero_followup, updated_at)
```

### 2.5 Integrações externas
| Serviço | Credencial n8n | Substituição no LangGraph |
|---|---|---|
| OpenAI | `Gonsolutions api` | `OPENAI_API_KEY` |
| Chatwoot | `Paris Imoveis` | `CHATWOOT_API_TOKEN` + base URL |
| Google Calendar | OAuth2 user | **Service Account JSON (base64)** |
| Google Gemini | API key | `GOOGLE_AI_API_KEY` |
| Postgres | `Conta paris` | Supabase `POSTGRES_CONNECTION_STRING` |
| ElevenLabs | API key | `ELEVENLABS_API_KEY` (opcional) |
| Supabase Storage | URL pública | reutiliza existente |

---

## 3. Estrutura de Arquivos (proposta)

```
paris2/
├── app/
│   ├── api/                     # (existente: properties, auth, upload)
│   │   ├── webhook/
│   │   │   └── chatwoot/
│   │   │       └── route.ts     # ★ Recebe webhook Chatwoot, enfileira, agenda after()
│   │   ├── cron/
│   │   │   └── followup/
│   │   │       └── route.ts     # ★ Vercel Cron (1/min) — agente de recuperação
│   │   └── agent/
│   │       └── test/
│   │           └── route.ts     # ★ Endpoint dev para testar agente sem Chatwoot
├── src/
│   ├── lib/                     # (existente: properties.ts)
│   │   ├── supabase-server.ts   # ★ Service-role client
│   │   ├── chatwoot.ts          # ★ Wrapper Chatwoot API
│   │   ├── google-auth.ts       # ★ Service Account auth
│   │   ├── google-calendar.ts   # ★ Calendar SDK helpers
│   │   ├── gemini-audio.ts      # ★ Whisper/transcrição via Gemini
│   │   ├── elevenlabs.ts        # ★ TTS (opcional)
│   │   ├── langfuse.ts          # ★ Handler factory
│   │   └── logger.ts            # ★ Pino logger
│   ├── prompts/
│   │   └── andrezinho.ts        # ★ Importa Workflows/SYSTEM_PROMPT_ANDREZINHO.md
│   ├── agents/
│   │   ├── secretaria/
│   │   │   ├── state.ts         # ★ Annotation.Root do StateGraph
│   │   │   ├── graph.ts         # ★ StateGraph principal
│   │   │   ├── memory.ts        # ★ PostgresChatMessageHistory
│   │   │   └── tools/
│   │   │       ├── buscar-imoveis.ts
│   │   │       ├── enviar-foto-imovel.ts
│   │   │       ├── buscar-janelas-disponiveis.ts
│   │   │       ├── criar-agendamento.ts
│   │   │       ├── buscar-agendamentos-contato.ts
│   │   │       ├── atualizar-agendamento.ts
│   │   │       ├── cancelar-agendamento.ts
│   │   │       ├── reagir-mensagem.ts
│   │   │       ├── enviar-texto-separado.ts
│   │   │       ├── alterar-preferencia-audio-texto.ts
│   │   │       ├── enviar-alerta-cancelamento.ts
│   │   │       ├── escalar-humano.ts
│   │   │       └── refletir.ts
│   │   └── followup/
│   │       ├── state.ts
│   │       ├── graph.ts
│   │       └── prompt.ts
│   ├── services/
│   │   ├── message-queue.ts     # ★ CRUD n8n_fila_mensagens
│   │   ├── attendance-lock.ts   # ★ Lock + status n8n_status_atendimento
│   │   ├── debounce-handler.ts  # ★ Lógica completa de "mensagem encavalada"
│   │   ├── text-formatter.ts    # ★ Chain LLM (remove **, #, emojis)
│   │   ├── ssml-formatter.ts    # ★ Chain LLM (datas/horas/telefones → SSML)
│   │   ├── message-splitter.ts  # ★ Workflow 07 (split LLM + envio com typing)
│   │   ├── transcribe.ts        # ★ Gemini audio → texto
│   │   ├── tts.ts               # ★ ElevenLabs SSML → mp3
│   │   └── send-message.ts      # ★ Router texto/áudio/reaction para Chatwoot
│   └── schemas/
│       └── chatwoot-webhook.ts  # ★ Zod schema do payload
├── supabase_migration_n8n_tables.sql  # ★ Cria as 3 tabelas se não existirem
├── vercel.json                  # ★ Atualizar com crons + maxDuration
└── .env.example                 # ★ Já criado
```

★ = arquivos novos a criar

---

## 4. Fluxo End-to-End

### 4.1 Mensagem recebida (texto/áudio/arquivo)
```
Chatwoot
  └─ POST /api/webhook/chatwoot
       ├─ Validação HMAC X-Chatwoot-Signature
       ├─ Parse Zod → state inicial
       ├─ Filtra eventos: só message_type === "incoming"
       ├─ Detecta /reset, /teste → handler dedicado (sem agente)
       ├─ Insere em n8n_fila_mensagens
       ├─ Responde 200 OK ao Chatwoot (~< 200ms)
       └─ after() executa em background:
            ├─ sleep(3000)  // debounce
            ├─ SELECT * FROM n8n_fila_mensagens WHERE telefone=?
            ├─ Se último id_mensagem != self → return (encavalada)
            ├─ Adquire lock advisory por telefone
            ├─ DELETE FROM n8n_fila_mensagens WHERE telefone=?
            ├─ Concatena mensagens da fila
            ├─ Se áudio: download + transcrição Gemini
            ├─ POST /update_last_seen (marca como lidas no Chatwoot)
            ├─ Invoca StateGraph (Secretária v3) com:
            │     - thread_id = telefone
            │     - input = mensagem concatenada
            │     - tools = 12 (Buscar imóveis, Calendar, Chatwoot, etc.)
            │     - callbacks = [langfuseHandler]
            ├─ Recebe output do agente
            ├─ Salva intermediate steps no histórico
            ├─ GET /contacts/:id (preferência audio/texto)
            ├─ Roteia para text-formatter ou ssml-formatter
            ├─ message-splitter divide e envia ao Chatwoot
            │   (texto: typing on → wait → send → wait 1s; áudio: ElevenLabs + recording status)
            └─ Libera lock
```

### 4.2 Follow-up (cron 1/min)
```
Vercel Cron → POST /api/cron/followup
  ├─ Valida Authorization: Bearer ${CRON_SECRET}
  ├─ SELECT * FROM n8n_status_atendimento
  │     WHERE aguardando_followup = true
  │     FOR UPDATE SKIP LOCKED LIMIT 1
  ├─ Para o lead encontrado:
  │     ├─ Busca conversa + contato no Chatwoot
  │     ├─ Gates: messages.length > 0 AND
  │     │       !labels.contains("agente-off") AND
  │     │       custom_attributes.asaas_status_cobranca != "Cobrança recebida"
  │     ├─ Verifica espaçamento: last_message.created_at < now - [6,24,48][numero_followup]
  │     ├─ Se passou: invoca followup-graph
  │     │     ├─ Lê histórico de n8n_historico_mensagens
  │     │     ├─ Gera mensagem reengajamento (gpt-4.1-mini, prompt Andrézinho follow-up)
  │     │     └─ Envia ao Chatwoot
  │     ├─ Atualiza numero_followup += 1
  │     └─ Se numero_followup >= max_followups: zera flag + adiciona label "agente-off"
  └─ Retorna 200
```

---

## 5. System Prompt — Estratégia

### 5.1 Fonte canônica
Arquivo: `Workflows/SYSTEM_PROMPT_ANDREZINHO.md` — **usar exatamente** como base, sem reescritura. O JSON do n8n tem uma versão ligeiramente desatualizada; o `.md` é a fonte de verdade.

### 5.2 Adaptação verbatim necessária
- Substituir placeholders n8n por interpolação TypeScript:
  - `{{ $now.format('FFFF') }}` → `format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })`
  - `{{ $('Info').item.json.agendamento_duracao_minutos }}` → `${env.AGENDAMENTO_DURACAO_MINUTOS}`
  - `{{ $('Info').item.json.atributos_contato.preferencia_audio_texto || 'ambos' }}` → `${state.preferencia_audio_texto || 'ambos'}`

### 5.3 DIFF necessário
- **PAPEL** (manter): "Você é o Andrézinho..." — sem alterações
- **CONTEXTO DA IMOBILIÁRIA** (preencher): o `.md` tem `[PREENCHER...]` em vários campos (horário, bairros, etc.). Manter os placeholders e usar env vars opcionais; o usuário preenche depois.
- **FERRAMENTAS** (manter): a lista no prompt cita 12 tools; o LangGraph implementará 12 (1:1 com o JSON do n8n).
- **EXEMPLOS** (manter): exemplos verbatim — não cortar.

### 5.4 Implementação
```ts
// src/prompts/andrezinho.ts
import fs from 'fs';
import path from 'path';

const RAW = fs.readFileSync(
  path.join(process.cwd(), 'Workflows', 'SYSTEM_PROMPT_ANDREZINHO.md'),
  'utf-8'
);

export function buildAndrezinhoPrompt(context: {
  agendamento_duracao_minutos: number;
  preferencia_audio_texto: 'audio' | 'texto' | 'ambos';
  now: Date;
}): string {
  return RAW
    .replaceAll("{{ $now.format('FFFF') }}", formatNowPtBR(context.now))
    .replaceAll(
      "{{ $('Info').item.json.agendamento_duracao_minutos }}",
      String(context.agendamento_duracao_minutos)
    )
    .replaceAll(
      "{{ $('Info').item.json.atributos_contato.preferencia_audio_texto || 'ambos' }}",
      context.preferencia_audio_texto
    );
}
```

---

## 6. Tools — Especificação 1:1

Cada tool LangGraph preserva **verbatim** a `toolDescription` do n8n original. Os schemas Zod refletem os `$fromAI(...)` do n8n.

### 6.1 Buscar_imoveis
- Descrição verbatim: `"Busca imóveis disponíveis no catálogo. Pode filtrar por tipo (Apartamento, Casa, Terreno, etc.), bairro, número mínimo de quartos, preço mínimo e máximo. Use sem parâmetros para listar todos os imóveis"`
- Implementação: `GET ${APP_URL}/api/properties/search?type=...&neighborhood=...&...` (rota já existe)
- Schema Zod: `{ type?, neighborhood?, bedrooms?, minPrice?, maxPrice?, query? }`

### 6.2 Enviar_foto_imovel
- Descrição: `"Utilize essa ferramenta para enviar uma foto de um imóvel para o cliente. Passe a URL da imagem retornada pela ferramenta Buscar_imoveis."`
- Implementação: download URL → POST multipart ao Chatwoot
- Schema: `{ image_url: string }`

### 6.3 Buscar_janelas_disponiveis
- Descrição verbatim do n8n (extensa — preservar literalmente)
- Implementação: porta o algoritmo verbatim de `## 03. Buscar janelas...` (4 funções JS extraídas: `gerar_janelas`, `filtrar_disponibilidade`, `selecionar_amostras`, `verificar_eventos`)
- Disponibilidade hardcoded → mover para env var JSON ou tabela `agendas_disponibilidade`
- Schema: `{ periodo_inicio: string, periodo_fim: string, id_agenda: string }`

### 6.4 Criar_agendamento
- Descrição verbatim (com warning de não chamar 2x)
- Implementação: pré-flight com `Buscar_janelas_disponiveis(periodo=evento_inicio, amostras=1)` → se vazio, retornar string literal `"HORÁRIO INDISPONÍVEL. VERIFICAR SE AGENDAMENTO JÁ NÃO FOI REALIZADO PARA ESSE CONTATO."`; senão, `calendar.events.insert` com `conferenceData.createRequest.conferenceSolutionKey.type = "hangoutsMeet"`
- Schema: `{ titulo, descricao, evento_inicio, id_agenda }`

### 6.5 Buscar_agendamentos_do_contato
- Descrição verbatim
- Implementação: `calendar.events.list(q=telefone, calendarId=id_agenda, singleEvents=true)`
- Schema: `{ id_agenda }`

### 6.6 Atualizar_agendamento
- Descrição verbatim (com nota de não mudar horário)
- Implementação: `calendar.events.patch(eventId, { summary, description })`
- Schema: `{ id_agenda, id_evento, titulo, descricao }`

### 6.7 Cancelar_agendamento
- Descrição verbatim
- Implementação: `calendar.events.delete(eventId)`
- Schema: `{ id_agenda, id_evento }`

### 6.8 Reagir_mensagem
- Descrição verbatim (com warning "NUNCA UTILIZE MÚLTIPLAS VEZES SEGUIDAS")
- Implementação: POST `/messages` com `content_attributes: { in_reply_to, is_reaction: true }`
- Schema: `{ content: string }` (emoji)

### 6.9 Enviar_texto_separado
- Descrição verbatim (uso exclusivo para áudio mode)
- Implementação: POST `/messages` simples
- Schema: `{ conteudo: string }`

### 6.10 Alterar_preferencia_audio_texto
- Descrição verbatim
- Implementação: PATCH `/contacts/:id` com merge de custom_attributes
- Schema: `{ preferencia_audio_texto: 'audio' | 'texto' | 'ambos' }`

### 6.11 Enviar_alerta_de_cancelamento
- Descrição verbatim
- Implementação: POST mensagem em `id_conversa_alerta`
- Schema: `{ mensagem: string }`

### 6.12 Escalar_humano (NÃO está no JSON mas está no prompt)
- Descrição: adicionar label "agente-off" na conversa via PUT `/conversations/:id/labels`
- Schema: `{ motivo?: string }`

### 6.13 Refletir
- Tool no-op (apenas registra no log). Implementar via `ToolNode` que retorna o input.

---

## 7. Pacotes a Instalar

```bash
# Comando ÚNICO (não editar package.json manualmente):
npm install @langchain/langgraph @langchain/openai @langchain/core @langchain/community \
  langfuse langfuse-langchain \
  pino pino-pretty \
  zod \
  googleapis google-auth-library \
  pg @types/pg \
  date-fns \
  @google/generative-ai

npm install -D @types/node
```

**Justificativa**:
- `@langchain/langgraph` — núcleo do orquestrador
- `@langchain/openai` — modelos GPT-4.1
- `@langchain/community` — `PostgresChatMessageHistory`
- `langfuse-langchain` — `CallbackHandler` para tracing
- `googleapis` — Calendar SDK + Gemini (alt: `@google/generative-ai`)
- `pg` — driver Postgres para advisory locks diretos
- `date-fns` — formatação de datas em pt-BR
- `pino` — logging estruturado

---

## 8. Milestones (entregas atômicas — commit cada uma)

### M1 — Fundação (1–2 commits)
- [ ] `npm install` dos pacotes listados
- [ ] Criar `.env.local` (copiar de `.env.example`) e usuário preenche
- [ ] `supabase_migration_n8n_tables.sql` — cria tabelas se não existirem
- [ ] `src/lib/logger.ts` — Pino
- [ ] `src/lib/langfuse.ts` — handler factory
- [ ] `src/lib/supabase-server.ts` — service-role client
- [ ] Teste: rodar `next dev` sem erros + endpoint health-check `/api/agent/test`

### M2 — Integrações Externas (1 commit por serviço)
- [ ] `src/lib/chatwoot.ts` — métodos `sendMessage`, `sendTypingStatus`, `markAsRead`, `getContact`, `updateContact`, `updateLabels`, `sendAttachment`
- [ ] `src/lib/google-auth.ts` — Service Account loader (base64)
- [ ] `src/lib/google-calendar.ts` — `listEvents`, `insertEvent`, `patchEvent`, `deleteEvent`
- [ ] `src/lib/gemini-audio.ts` — transcrição
- [ ] `src/lib/elevenlabs.ts` — TTS (com `ENABLE_AUDIO_RESPONSES` gate)
- [ ] Teste manual: cada wrapper invocado por endpoint dev

### M3 — Services (state/lock/queue) (2 commits)
- [ ] `src/services/message-queue.ts` — `enqueue`, `selectByPhone`, `deleteByPhone`
- [ ] `src/services/attendance-lock.ts` — `tryLock`, `release`, `markPendingFollowup`, `clearStatus`
- [ ] `src/services/debounce-handler.ts` — função `runDebouncedProcessing(telefone, id_mensagem)` que faz sleep/select/encavalada-check/lock
- [ ] Testes manuais via endpoint dev simulando 2 mensagens consecutivas

### M4 — Prompt + System (1 commit)
- [ ] `src/prompts/andrezinho.ts` — carrega `.md` + substitui placeholders
- [ ] Snapshot test: prompt resultante para input fixo

### M5 — Tools (1 commit por tool, agrupando relacionadas — ~5 commits)
- [ ] Tool group A: imóveis (`buscar-imoveis`, `enviar-foto-imovel`)
- [ ] Tool group B: agenda (`buscar-janelas-disponiveis` com 4 funções verbatim, `criar-agendamento` com pré-flight, `buscar-agendamentos-contato`, `atualizar-agendamento`, `cancelar-agendamento`)
- [ ] Tool group C: comunicação (`reagir-mensagem`, `enviar-texto-separado`, `alterar-preferencia-audio-texto`, `enviar-alerta-cancelamento`, `escalar-humano`)
- [ ] Tool group D: meta (`refletir`)
- [ ] Cada tool com schema Zod e descrição verbatim

### M6 — Memória + StateGraph principal (2 commits)
- [ ] `src/agents/secretaria/state.ts` — Annotation.Root
- [ ] `src/agents/secretaria/memory.ts` — `PostgresChatMessageHistory` (sessionKey=telefone)
- [ ] `src/agents/secretaria/graph.ts` — `createReactAgent` ou StateGraph manual com 12 tools, modelo gpt-4.1, callbacks Langfuse
- [ ] Teste local: invocar graph com input "Oi" e verificar resposta de saudação

### M7 — Pós-processamento de resposta (1 commit)
- [ ] `src/services/text-formatter.ts` — chain LLM (remove `**`, `#`, emojis em runs especiais)
- [ ] `src/services/ssml-formatter.ts` — chain LLM (datas/horas/telefones → SSML)
- [ ] `src/services/message-splitter.ts` — porta verbatim do workflow 07 (LLM split + typing on/off + delays calculados)
- [ ] `src/services/send-message.ts` — router texto/áudio

### M8 — Webhook handler (1 commit)
- [ ] `src/schemas/chatwoot-webhook.ts` — Zod schema
- [ ] `app/api/webhook/chatwoot/route.ts`:
  - Valida HMAC
  - Detecta `/reset` e `/teste` (handlers inline)
  - Enfileira + responde 200
  - `after()` chama `runDebouncedProcessing` → graph
- [ ] `export const maxDuration = 60` na route
- [ ] Teste E2E: enviar mensagem de teste do Chatwoot → resposta no WhatsApp

### M9 — Agente de Follow-up (2 commits)
- [ ] `src/agents/followup/` — prompt adaptado de "Maria, secretária da clínica" para "Andrézinho, follow-up Paris Imóveis" (extrair do JSON do workflow 13 e reescrever)
- [ ] `app/api/cron/followup/route.ts` — valida `CRON_SECRET`, SELECT FOR UPDATE SKIP LOCKED, invoca graph
- [ ] `vercel.json` — adicionar `crons: [{ path: '/api/cron/followup', schedule: '* * * * *' }]`
- [ ] Teste manual: forçar `aguardando_followup=true` em um lead e disparar a rota

### M10 — Endpoint de teste + visualização (1 commit)
- [ ] `app/api/agent/test/route.ts` — invoca graph com input arbitrário (protegido por `CRON_SECRET` ou env DEV)
- [ ] `scripts/visualize-graphs.ts` — gera PNGs dos dois grafos (Mermaid)
- [ ] README com instruções de uso/debug

### M11 — Migração de dados (se aplicável)
- [ ] Verificar se há histórico em `n8n_historico_mensagens` em produção — manter coexistência (mesmo schema)
- [ ] Migrar variável `Info.url_api` (n8n) → env `APP_URL` (deploy paralelo durante validação)

### M12 — Cutover (1 commit)
- [ ] Desabilitar webhook do n8n no Chatwoot
- [ ] Apontar webhook Chatwoot para `https://<APP_URL>/api/webhook/chatwoot`
- [ ] Monitorar Langfuse 24h
- [ ] Arquivar workflows n8n

---

## 9. Critérios de Verificação por Milestone

Após cada milestone, rodar `/n8n-to-langgraph review` para auditar:
- Prompts verbatim preservados?
- Tools com descrição exata do n8n?
- Lógica de debounce + encavalada funcional?
- Erros de timeout na Vercel?
- Lock advisory funciona com concorrência?
- Langfuse traces aparecem para cada invocação?

**Gate de aceitação geral (UAT)**:
1. Cliente envia "Oi" → Andrézinho responde com saudação personalizada
2. Cliente pede imóveis → tool `Buscar_imoveis` chamada, top 2-3 retornados
3. Cliente pede foto → tool `Enviar_foto_imovel` envia attachment
4. Cliente quer agendar → `Buscar_janelas_disponiveis` + `Criar_agendamento` funcionais
5. `/reset` limpa memória e atributos
6. Duas mensagens em < 3s viram uma única invocação ao agente (debounce)
7. Follow-up dispara em lead inativo após 6h
8. Tracing completo no Langfuse

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `next/after` exceder 60s no Pro | Média | Limitar tools com timeout 15s; usar streaming; fallback para QStash em caso de erro |
| Race condition mensagem encavalada | Alta sem mitigação | Advisory lock + check de id_mensagem (replicado verbatim do n8n) |
| Service Account sem permissão em calendar | Alta | Documentar setup: compartilhar calendário com email da SA |
| ElevenLabs SSML rejeita formato | Média | Validar `<speak>` antes de enviar; fallback texto |
| Custos OpenAI explodirem | Baixa | `OPENAI_MODEL_FAST` para formatters; Langfuse cost monitoring |
| Webhook Chatwoot retry causar duplicação | Média | Idempotência via `id_mensagem` (já é unique key da fila) |
| Cron Vercel não dispara no Hobby | Alta | Confirmar plano Pro; documentar requisito |

---

## 11. Diretrizes para o ralph-loop / executor

**Linguagem**: PT-BR em commits, comentários (mínimos), nomes de variáveis em PT-BR onde fizer sentido (igual ao n8n original: `telefone`, `mensagem`, `id_conversa`).

**Comandos proibidos**: NÃO editar `package.json` manualmente. Sempre `npm install`.

**Commits**: 1 commit atômico por subtask. Mensagem em PT-BR:
- `feat(agente): adiciona tool buscar_imoveis`
- `fix(webhook): valida HMAC do Chatwoot`
- `refactor(memory): migra para PostgresChatMessageHistory`

**Testes**: após cada milestone, criar arquivo de teste manual em `scripts/test-mX-*.ts` que exercita o componente. Não usar framework de teste (mantém leveza).

**Logging**: usar `logger` (Pino) em TODO lugar — webhook recebido, tool chamada, erro de API, lock adquirido/liberado, mensagem enviada. Nunca `console.log`.

**Langfuse**: cada `graph.invoke()` recebe `callbacks: [createLangfuseHandler(...)]` com `sessionId = telefone`. Sempre `try/finally` com `flushLangfuseHandler`.

**Erros**: nunca expor erros técnicos ao cliente. Em caso de falha do agente, enviar mensagem genérica e escalar humano via label.

**Skills disponíveis durante execução**:
- `chatwoot-skills:*` se existir, para padrões Chatwoot
- LangChain.js / LangGraph.js docs via Context7

**Verificação final**: rodar visualização de grafos (`scripts/visualize-graphs.ts`) e anexar PNGs no PR final.

---

## 12. Próximos passos imediatos

1. **Usuário preencher `.env.local`** com credenciais reais (mínimo: OpenAI, Chatwoot, Supabase Service Role, Postgres connection, Google Service Account, Google Calendar Agenda ID)
2. Confirmar **plano Vercel é Pro ou superior** (necessário para `maxDuration=60` e cron `* * * * *`)
3. Confirmar **versão do Next.js suporta `next/after`** (Next 15+; este projeto está em 16.1.1 ✅)
4. Decidir se **ElevenLabs será ativado** agora (gate: `ENABLE_AUDIO_RESPONSES`)
5. Executar M1 (fundação) e validar
6. Prosseguir milestone a milestone com `/n8n-to-langgraph review` entre cada um
