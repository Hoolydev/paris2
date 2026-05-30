import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { buildAndrezinhoPrompt } from '@/prompts/andrezinho';
import { buildTools, ToolContext } from './tools';
import { loadHistory, appendMessages } from './memory';
import { logger } from '@/lib/logger';

// ============================================================
// Agente Andrézinho (Secretária v3) — createReactAgent com GPT-4.1.
// Stateless: carrega histórico do Supabase, invoca, persiste novas mensagens.
// ============================================================

export interface RunAgentInput extends ToolContext {
    mensagem: string;
    preferenciaAudioTexto?: 'audio' | 'texto' | 'ambos';
}

export async function runSecretaria(input: RunAgentInput): Promise<string> {
    const model = new ChatOpenAI({
        model: process.env.OPENAI_MODEL || 'gpt-4.1',
        temperature: 0.5,
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 45000,
    });

    const tools = buildTools({
        telefone: input.telefone,
        idConversa: input.idConversa,
        idContato: input.idContato,
        idMensagem: input.idMensagem,
        idAgenda: input.idAgenda,
    });

    const prompt = buildAndrezinhoPrompt({
        agendamentoDuracaoMinutos: parseInt(
            process.env.AGENDAMENTO_DURACAO_MINUTOS || '30',
            10
        ),
        preferenciaAudioTexto: input.preferenciaAudioTexto || 'ambos',
        now: new Date(),
    });

    const agent = createReactAgent({ llm: model, tools, prompt });

    const history = await loadHistory(input.telefone);
    const humanMessage = new HumanMessage(input.mensagem);

    const result = await agent.invoke(
        { messages: [...history, humanMessage] },
        { recursionLimit: 25 }
    );

    const messages = result.messages as BaseMessage[];
    const last = messages[messages.length - 1];
    const reply =
        typeof last?.content === 'string'
            ? last.content
            : Array.isArray(last?.content)
              ? last.content
                    .map((c: any) => (typeof c === 'string' ? c : c.text || ''))
                    .join('')
              : '';

    // Persiste apenas a mensagem do cliente e a resposta final (texto) do agente.
    // Mensagens intermediárias de tool ficam fora do histórico de longo prazo.
    await appendMessages(input.telefone, [humanMessage, new AIMessage(reply)]);

    logger.info(
        { telefone: input.telefone, replyLen: reply.length },
        'Agente respondeu'
    );

    return reply.trim();
}
