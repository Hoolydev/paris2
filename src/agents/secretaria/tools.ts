import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchProperties } from '@/lib/properties';
import {
    sendMessage,
    reactToMessage,
    sendAttachmentFromUrl,
    updateContactAttributes,
    addConversationLabel,
} from '@/lib/chatwoot';
import {
    buscarJanelas,
    criarEvento,
    listarAgendamentosContato,
    atualizarEvento,
    cancelarEvento,
} from '@/lib/google-calendar';
import { logger } from '@/lib/logger';

// Contexto da conversa atual, injetado nas tools a cada invocação.
export interface ToolContext {
    telefone: string;
    idConversa: number | string;
    idContato: number | string;
    idMensagem: number | string;
    idAgenda: string; // GOOGLE_CALENDAR_AGENDA_ID
}

// Garante offset de Brasília quando o LLM passa datetime sem timezone.
function normalizeBrDateTime(input: string): string {
    const s = input.trim().replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        return `${s.length === 16 ? s + ':00' : s}-03:00`;
    }
    return input;
}

export function buildTools(ctx: ToolContext) {
    const idConversaAlerta =
        process.env.CHATWOOT_ID_CONVERSA_ALERTA || String(ctx.idConversa);

    // ---------- Imóveis ----------

    const Buscar_imoveis = tool(
        async (input) => {
            const results = await searchProperties({
                type: input.type,
                neighborhood: input.neighborhood,
                bedrooms: input.bedrooms,
                minPrice: input.minPrice,
                maxPrice: input.maxPrice,
                query: input.query,
            });
            logger.info({ filtros: input, total: results.length }, 'Buscar_imoveis');
            if (!results.length) {
                return 'Nenhum imóvel encontrado com esses critérios.';
            }
            // Retorna no máximo 8 para o modelo escolher 2-3.
            const top = results.slice(0, 8).map((p) => ({
                id: p.id,
                titulo: p.title,
                tipo: p.type,
                bairro: p.neighborhood,
                local: p.location,
                preco: p.price,
                quartos: p.bedrooms,
                banheiros: p.bathrooms,
                garagem: p.garage,
                area_construida: p.builtArea,
                area_terreno: p.landArea,
                descricao: p.description,
                fotos: (p.images || []).slice(0, 5),
                link: `${process.env.APP_URL || ''}/imovel/${p.id}`,
            }));
            return JSON.stringify(top);
        },
        {
            name: 'Buscar_imoveis',
            description:
                'Busca imóveis disponíveis no catálogo. Pode filtrar por tipo (Apartamento, Casa, Terreno, Minha Casa Minha Vida), bairro, número mínimo de quartos, preço mínimo e máximo. Use sem parâmetros para listar todos os imóveis.',
            schema: z.object({
                type: z.string().optional().describe('Tipo do imóvel'),
                neighborhood: z.string().optional().describe('Bairro em Goianésia'),
                bedrooms: z.number().optional().describe('Número mínimo de quartos'),
                minPrice: z.number().optional().describe('Preço mínimo em reais'),
                maxPrice: z.number().optional().describe('Preço máximo em reais'),
                query: z.string().optional().describe('Busca por texto livre'),
            }),
        }
    );

    const Enviar_foto_imovel = tool(
        async (input) => {
            await sendAttachmentFromUrl(ctx.idConversa, input.image_url);
            return 'Foto enviada ao cliente com sucesso.';
        },
        {
            name: 'Enviar_foto_imovel',
            description:
                'Utilize essa ferramenta para enviar uma foto de um imóvel para o cliente. Passe a URL da imagem retornada pela ferramenta Buscar_imoveis.',
            schema: z.object({
                image_url: z.string().describe('URL da imagem do imóvel'),
            }),
        }
    );

    // ---------- Agendamento ----------

    const Buscar_janelas_disponiveis = tool(
        async (input) => {
            const slots = await buscarJanelas(
                input.id_agenda || ctx.idAgenda,
                normalizeBrDateTime(input.periodo_inicio),
                normalizeBrDateTime(input.periodo_fim),
                3
            );
            if (!slots.length) {
                return 'Nenhum horário disponível nesse período. Sugira outro dia/horário ao cliente.';
            }
            return JSON.stringify(
                slots.map((s) => ({ horario_iso: s.inicio, descricao: s.label }))
            );
        },
        {
            name: 'Buscar_janelas_disponiveis',
            description:
                'Identifica horários disponíveis para visitas no período informado, respeitando o horário de atendimento. Informe periodo_inicio e periodo_fim no formato ISO (ex: 2026-06-02T08:00).',
            schema: z.object({
                periodo_inicio: z.string().describe('Início do período (ISO)'),
                periodo_fim: z.string().describe('Fim do período (ISO)'),
                id_agenda: z.string().optional().describe('ID da agenda (opcional)'),
            }),
        }
    );

    const Criar_agendamento = tool(
        async (input) => {
            const idAgenda = input.id_agenda || ctx.idAgenda;
            const inicio = normalizeBrDateTime(input.evento_inicio);
            // Pré-flight: confere se o horário ainda está livre.
            const livre = await buscarJanelas(idAgenda, inicio, inicio, 1).catch(
                () => []
            );
            const start = new Date(inicio).getTime();
            const slotOk = livre.some((s) => new Date(s.inicio).getTime() === start);
            if (!slotOk) {
                return 'HORÁRIO INDISPONÍVEL. VERIFICAR SE AGENDAMENTO JÁ NÃO FOI REALIZADO PARA ESSE CONTATO.';
            }
            const ev = await criarEvento(idAgenda, {
                titulo: input.titulo,
                descricao: `${input.descricao}\nTelefone: ${ctx.telefone}`,
                eventoInicioISO: inicio,
            });
            logger.info({ id: ev.id }, 'Criar_agendamento');
            return JSON.stringify({
                sucesso: true,
                id_evento: ev.id,
                inicio: ev.inicio,
                link_meet: ev.meetLink,
            });
        },
        {
            name: 'Criar_agendamento',
            description:
                'Cria um agendamento de visita. Use somente após confirmar com o cliente e ter um horário disponível. NÃO chame duas vezes para o mesmo horário. Parâmetros: titulo, descricao, evento_inicio (ISO).',
            schema: z.object({
                titulo: z.string().describe('Nome do cliente + imóvel'),
                descricao: z.string().describe('Detalhes da visita'),
                evento_inicio: z.string().describe('Horário de início (ISO)'),
                id_agenda: z.string().optional(),
            }),
        }
    );

    const Buscar_agendamentos_do_contato = tool(
        async (input) => {
            const eventos = await listarAgendamentosContato(
                input.id_agenda || ctx.idAgenda,
                ctx.telefone
            );
            if (!eventos.length) return 'Nenhum agendamento encontrado para este contato.';
            return JSON.stringify(eventos);
        },
        {
            name: 'Buscar_agendamentos_do_contato',
            description:
                'Lista as visitas agendadas do cliente. Use antes de atualizar ou cancelar para obter o id_evento correto.',
            schema: z.object({ id_agenda: z.string().optional() }),
        }
    );

    const Atualizar_agendamento = tool(
        async (input) => {
            await atualizarEvento(input.id_agenda || ctx.idAgenda, input.id_evento, {
                titulo: input.titulo,
                descricao: input.descricao,
            });
            return 'Agendamento atualizado com sucesso.';
        },
        {
            name: 'Atualizar_agendamento',
            description:
                'Modifica uma visita existente (título/descrição) sem alterar o horário. Caso principal: adicionar "[CONFIRMADO]" ao título.',
            schema: z.object({
                id_evento: z.string().describe('ID do evento'),
                titulo: z.string().optional(),
                descricao: z.string().optional(),
                id_agenda: z.string().optional(),
            }),
        }
    );

    const Cancelar_agendamento = tool(
        async (input) => {
            await cancelarEvento(input.id_agenda || ctx.idAgenda, input.id_evento);
            return 'Agendamento cancelado. Lembre-se de usar Enviar_alerta_de_cancelamento.';
        },
        {
            name: 'Cancelar_agendamento',
            description:
                'Cancela uma visita existente. Sempre siga com Enviar_alerta_de_cancelamento.',
            schema: z.object({
                id_evento: z.string().describe('ID do evento'),
                id_agenda: z.string().optional(),
            }),
        }
    );

    // ---------- Comunicação ----------

    const Reagir_mensagem = tool(
        async (input) => {
            await reactToMessage(ctx.idConversa, input.content, ctx.idMensagem);
            return 'Reação enviada.';
        },
        {
            name: 'Reagir_mensagem',
            description:
                'Adiciona uma reação (emoji) à última mensagem do cliente. NUNCA UTILIZE MÚLTIPLAS VEZES SEGUIDAS. Emojis permitidos: 😀 ❤️ 👍 👀 ✅ 🏠.',
            schema: z.object({ content: z.string().describe('Emoji da reação') }),
        }
    );

    const Alterar_preferencia_audio_texto = tool(
        async (input) => {
            await updateContactAttributes(ctx.idContato, {
                preferencia_audio_texto: input.preferencia_audio_texto,
            });
            return `Preferência alterada para "${input.preferencia_audio_texto}".`;
        },
        {
            name: 'Alterar_preferencia_audio_texto',
            description:
                'Altera a preferência de formato de resposta do cliente (audio, texto ou ambos). Use quando o cliente solicitar.',
            schema: z.object({
                preferencia_audio_texto: z.enum(['audio', 'texto', 'ambos']),
            }),
        }
    );

    const Enviar_alerta_de_cancelamento = tool(
        async (input) => {
            await sendMessage(idConversaAlerta, `🚨 Cancelamento de visita\n${input.mensagem}`, {
                isPrivate: true,
            });
            return 'Alerta de cancelamento enviado ao gestor.';
        },
        {
            name: 'Enviar_alerta_de_cancelamento',
            description:
                'Envia um alerta interno ao gestor sobre cancelamento de visita. Inclua nome do cliente, imóvel, data/hora e motivo.',
            schema: z.object({ mensagem: z.string() }),
        }
    );

    const Escalar_humano = tool(
        async (input) => {
            await addConversationLabel(ctx.idConversa, 'agente-off');
            logger.info({ motivo: input.motivo, telefone: ctx.telefone }, 'Escalar_humano');
            return 'Conversa encaminhada para atendimento humano (label "agente-off" adicionada). Informe o cliente que um consultor irá atendê-lo.';
        },
        {
            name: 'Escalar_humano',
            description:
                'Encaminha a conversa para um atendente humano. Use para negociação de valores, questões jurídicas, insatisfação grave, pedidos de parar mensagens ou assuntos fora do escopo.',
            schema: z.object({ motivo: z.string().optional() }),
        }
    );

    const Refletir = tool(
        async (input) => {
            logger.info({ reflexao: input.pensamento }, 'Refletir');
            return 'Reflexão registrada. Prossiga com a ação planejada.';
        },
        {
            name: 'Refletir',
            description:
                'Use antes de operações complexas para organizar critérios de busca, revisar ações ou avaliar casos duvidosos. Não é visível ao cliente.',
            schema: z.object({ pensamento: z.string() }),
        }
    );

    return [
        Buscar_imoveis,
        Enviar_foto_imovel,
        Buscar_janelas_disponiveis,
        Criar_agendamento,
        Buscar_agendamentos_do_contato,
        Atualizar_agendamento,
        Cancelar_agendamento,
        Reagir_mensagem,
        Alterar_preferencia_audio_texto,
        Enviar_alerta_de_cancelamento,
        Escalar_humano,
        Refletir,
    ];
}
