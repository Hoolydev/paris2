import { logger } from './logger';

// ============================================================
// Wrapper da API do Chatwoot. Endpoints replicados 1:1 do n8n original.
// Auth via header `api_access_token`. Base URL e account id vêm do env.
// ============================================================

function baseUrl(): string {
    const url = process.env.CHATWOOT_URL;
    if (!url) throw new Error('CHATWOOT_URL não definido.');
    return url.replace(/\/+$/, ''); // remove barra(s) final(is)
}

function accountId(): string {
    const id = process.env.CHATWOOT_ACCOUNT_ID || '1';
    return String(id);
}

function token(): string {
    const t = process.env.CHATWOOT_API_TOKEN;
    if (!t) throw new Error('CHATWOOT_API_TOKEN não definido.');
    return t;
}

async function chatwootFetch(
    path: string,
    init: RequestInit & { json?: unknown } = {}
): Promise<any> {
    const { json, headers, ...rest } = init;
    const url = `${baseUrl()}/api/v1/accounts/${accountId()}${path}`;

    const res = await fetch(url, {
        ...rest,
        headers: {
            api_access_token: token(),
            ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(headers || {}),
        },
        body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

    const text = await res.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        logger.error({ path, status: res.status, data }, 'Chatwoot API erro');
        throw new Error(`Chatwoot ${path} → ${res.status}`);
    }
    return data;
}

// ---------- Mensagens ----------

export async function sendMessage(
    idConversa: number | string,
    content: string,
    opts: { contentAttributes?: Record<string, unknown>; isPrivate?: boolean } = {}
): Promise<any> {
    return chatwootFetch(`/conversations/${idConversa}/messages`, {
        method: 'POST',
        json: {
            content,
            message_type: 'outgoing',
            private: opts.isPrivate ?? false,
            ...(opts.contentAttributes
                ? { content_attributes: opts.contentAttributes }
                : {}),
        },
    });
}

// Reação a uma mensagem (emoji). Replica content_attributes do n8n.
export async function reactToMessage(
    idConversa: number | string,
    emoji: string,
    inReplyTo?: number | string
): Promise<any> {
    return chatwootFetch(`/conversations/${idConversa}/messages`, {
        method: 'POST',
        json: {
            content: emoji,
            message_type: 'outgoing',
            content_attributes: {
                ...(inReplyTo ? { in_reply_to: inReplyTo } : {}),
                is_reaction: true,
            },
        },
    });
}

// ---------- Indicadores ----------

export async function toggleTyping(
    idConversa: number | string,
    status: 'on' | 'off' | 'recording'
): Promise<void> {
    try {
        await chatwootFetch(`/conversations/${idConversa}/toggle_typing_status`, {
            method: 'POST',
            json: { typing_status: status },
        });
    } catch (err) {
        // Indicador é cosmético — não deve quebrar o fluxo.
        logger.warn({ err: String(err) }, 'toggleTyping falhou (ignorado)');
    }
}

export async function markAsRead(idConversa: number | string): Promise<void> {
    try {
        await chatwootFetch(`/conversations/${idConversa}/update_last_seen`, {
            method: 'POST',
        });
    } catch (err) {
        logger.warn({ err: String(err) }, 'markAsRead falhou (ignorado)');
    }
}

// ---------- Contatos ----------

export async function getContact(idContato: number | string): Promise<any> {
    const res = await chatwootFetch(`/contacts/${idContato}`, { method: 'GET' });
    return res?.payload ?? res;
}

export async function getContactCustomAttributes(
    idContato: number | string
): Promise<Record<string, any>> {
    const contact = await getContact(idContato);
    return contact?.custom_attributes ?? {};
}

export async function updateContactAttributes(
    idContato: number | string,
    customAttributes: Record<string, unknown>
): Promise<any> {
    // Merge: lê os existentes e sobrescreve apenas as chaves passadas.
    const current = await getContactCustomAttributes(idContato).catch(() => ({}));
    return chatwootFetch(`/contacts/${idContato}`, {
        method: 'PUT',
        json: { custom_attributes: { ...current, ...customAttributes } },
    });
}

export async function destroyContactAttributes(
    idContato: number | string,
    keys: string[]
): Promise<any> {
    return chatwootFetch(`/contacts/${idContato}/destroy_custom_attributes`, {
        method: 'POST',
        json: { custom_attributes: keys },
    });
}

// ---------- Labels (escalar humano / modo teste) ----------

export async function getConversationLabels(
    idConversa: number | string
): Promise<string[]> {
    const res = await chatwootFetch(`/conversations/${idConversa}/labels`, {
        method: 'GET',
    });
    return res?.payload ?? [];
}

export async function setConversationLabels(
    idConversa: number | string,
    labels: string[]
): Promise<any> {
    return chatwootFetch(`/conversations/${idConversa}/labels`, {
        method: 'POST',
        json: { labels: Array.from(new Set(labels)) },
    });
}

export async function addConversationLabel(
    idConversa: number | string,
    label: string
): Promise<any> {
    const current = await getConversationLabels(idConversa).catch(() => []);
    return setConversationLabels(idConversa, [...current, label]);
}

export async function removeConversationLabel(
    idConversa: number | string,
    label: string
): Promise<any> {
    const current = await getConversationLabels(idConversa).catch(() => []);
    return setConversationLabels(
        idConversa,
        current.filter((l) => l !== label)
    );
}

// ---------- Anexos (enviar foto de imóvel) ----------

export async function sendAttachmentFromUrl(
    idConversa: number | string,
    imageUrl: string,
    caption = ''
): Promise<any> {
    // Baixa a imagem da URL pública e reenvia como attachment multipart.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
        throw new Error(`Falha ao baixar imagem: ${imageUrl} (${imgRes.status})`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType =
        imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const blob = new Blob([arrayBuffer], { type: contentType });

    const form = new FormData();
    if (caption) form.append('content', caption);
    form.append('message_type', 'outgoing');
    form.append('attachments[]', blob, `imovel.${ext}`);

    const url = `${baseUrl()}/api/v1/accounts/${accountId()}/conversations/${idConversa}/messages`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { api_access_token: token() },
        body: form,
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        logger.error({ status: res.status, body: t }, 'sendAttachment erro');
        throw new Error(`Chatwoot attachment → ${res.status}`);
    }
    return res.json().catch(() => null);
}
