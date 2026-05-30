import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import crypto from 'crypto';
import { chatwootWebhookSchema, normalizeWebhook } from '@/schemas/chatwoot-webhook';
import { enqueue } from '@/services/message-queue';
import { runDebouncedProcessing } from '@/services/process-message';
import { detectCommand, handleReset, handleTeste } from '@/services/commands';
import { logger } from '@/lib/logger';

// Requer Vercel Pro: o after() roda o agente em background até ~60s.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Validação HMAC opcional. Só valida se o secret estiver configurado E o
// header de assinatura vier no request — evita derrubar todo o webhook caso
// o Chatwoot não esteja assinando (varia por versão/config).
function hmacOk(rawBody: string, headerSig: string | null): boolean {
    const secret = process.env.CHATWOOT_WEBHOOK_SECRET;
    if (!secret || !headerSig) return true;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf-8')
        .digest('hex');
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(headerSig.replace(/^sha256=/, ''))
        );
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();

    const sig =
        request.headers.get('x-chatwoot-signature') ||
        request.headers.get('x-hub-signature-256');
    if (!hmacOk(rawBody, sig)) {
        logger.warn('Assinatura HMAC inválida — rejeitando webhook');
        return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 });
    }

    let json: unknown;
    try {
        json = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
    }

    const parsed = chatwootWebhookSchema.safeParse(json);
    if (!parsed.success) {
        logger.warn({ issues: parsed.error.issues }, 'Payload Chatwoot inesperado');
        return NextResponse.json({ ok: true, ignored: 'unparseable' });
    }

    const msg = normalizeWebhook(parsed.data);

    // Só processa mensagens recebidas do cliente.
    if (msg.messageType !== 'incoming') {
        return NextResponse.json({ ok: true, ignored: 'not incoming' });
    }
    if (!msg.telefone || msg.idConversa == null) {
        logger.warn({ msg }, 'Mensagem sem telefone/conversa — ignorada');
        return NextResponse.json({ ok: true, ignored: 'missing identifiers' });
    }

    // Não responder em conversas escaladas para humano.
    if (msg.labels.includes('agente-off')) {
        return NextResponse.json({ ok: true, ignored: 'agente-off' });
    }

    // Comandos especiais (funcionam mesmo fora do gate de teste).
    const cmd = detectCommand(msg.conteudo);
    if (cmd === 'reset') {
        await handleReset({
            telefone: msg.telefone,
            idConversa: msg.idConversa,
            idContato: msg.idContato!,
        }).catch((e) => logger.error({ e: String(e) }, '/reset falhou'));
        return NextResponse.json({ ok: true, command: 'reset' });
    }
    if (cmd === 'teste') {
        await handleTeste({ idConversa: msg.idConversa }).catch((e) =>
            logger.error({ e: String(e) }, '/teste falhou')
        );
        return NextResponse.json({ ok: true, command: 'teste' });
    }

    // Gate de segurança: durante a validação, só responder em conversas
    // marcadas com "testando-agente". Desative com REQUIRE_TEST_LABEL=false.
    const requireTestLabel =
        (process.env.REQUIRE_TEST_LABEL || 'true').toLowerCase() !== 'false';
    if (requireTestLabel && !msg.labels.includes('testando-agente')) {
        return NextResponse.json({ ok: true, ignored: 'sem label testando-agente' });
    }

    // Áudio/arquivo: nesta fase só tratamos texto. Avisa o cliente.
    if (msg.isAudio || (msg.hasAttachment && !msg.conteudo)) {
        logger.info({ telefone: msg.telefone }, 'Mensagem de mídia recebida (sem transcrição)');
        const conteudo = msg.conteudo || '';
        if (!conteudo) {
            // Enfileira um aviso textual mínimo para o agente responder com elegância.
            await enqueue(
                msg.telefone,
                msg.idMensagem || String(Date.now()),
                '[O cliente enviou um áudio ou arquivo que ainda não consigo abrir. Peça gentilmente para enviar a mensagem em texto.]'
            );
        } else {
            await enqueue(msg.telefone, msg.idMensagem || String(Date.now()), conteudo);
        }
    } else {
        // Mensagem de texto normal → fila.
        await enqueue(msg.telefone, msg.idMensagem || String(Date.now()), msg.conteudo);
    }

    // Processamento em background (debounce + agente) após responder 200.
    const ctx = {
        telefone: msg.telefone,
        idMensagem: msg.idMensagem || '',
        idConversa: msg.idConversa,
        idContato: msg.idContato!,
    };
    after(async () => {
        try {
            await runDebouncedProcessing(ctx);
        } catch (err) {
            logger.error({ err: String(err) }, 'Erro fatal no after()');
        }
    });

    return NextResponse.json({ ok: true });
}

// Healthcheck simples (GET).
export async function GET() {
    return NextResponse.json({ ok: true, service: 'chatwoot-webhook' });
}
