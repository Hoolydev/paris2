import { z } from 'zod';

// ============================================================
// Schema (tolerante) do payload do webhook do Chatwoot.
// Caminhos extraídos do workflow n8n original ($json.body.*).
// passthrough() em todos os níveis — o Chatwoot envia muitos campos extras.
// ============================================================

const attachment = z
    .object({
        file_type: z.string().optional(),
        data_url: z.string().optional(),
        meta: z.object({ is_recorded_audio: z.boolean().optional() }).passthrough().optional(),
    })
    .passthrough();

export const chatwootWebhookSchema = z
    .object({
        event: z.string().optional(),
        message_type: z.string().optional(),
        content: z.string().nullable().optional(),
        id: z.union([z.number(), z.string()]).optional(),
        attachments: z.array(attachment).optional(),
        sender: z
            .object({
                phone_number: z.string().nullable().optional(),
                identifier: z.string().nullable().optional(),
                custom_attributes: z.record(z.string(), z.any()).optional(),
            })
            .passthrough()
            .optional(),
        conversation: z
            .object({
                id: z.union([z.number(), z.string()]).optional(),
                labels: z.array(z.string()).optional(),
                contact_inbox: z
                    .object({
                        contact_id: z.union([z.number(), z.string()]).optional(),
                    })
                    .passthrough()
                    .optional(),
            })
            .passthrough()
            .optional(),
        account: z
            .object({ id: z.union([z.number(), z.string()]).optional() })
            .passthrough()
            .optional(),
    })
    .passthrough();

export type ChatwootWebhook = z.infer<typeof chatwootWebhookSchema>;

// Normaliza os campos relevantes a partir do payload bruto.
export interface NormalizedMessage {
    telefone: string | null;
    conteudo: string;
    idMensagem: string | null;
    idConversa: number | string | null;
    idContato: number | string | null;
    messageType: string | null;
    labels: string[];
    isAudio: boolean;
    hasAttachment: boolean;
}

export function normalizeWebhook(body: ChatwootWebhook): NormalizedMessage {
    const att = body.attachments?.[0];
    const telefone =
        body.sender?.phone_number?.replace(/[^\d+]/g, '') ||
        body.sender?.identifier ||
        null;
    return {
        telefone,
        conteudo: body.content || '',
        idMensagem: body.id != null ? String(body.id) : null,
        idConversa: body.conversation?.id ?? null,
        idContato: body.conversation?.contact_inbox?.contact_id ?? null,
        messageType: body.message_type ?? null,
        labels: body.conversation?.labels || [],
        isAudio: Boolean(att?.meta?.is_recorded_audio),
        hasAttachment: Boolean(att),
    };
}
