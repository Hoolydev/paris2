import { sendMessage, toggleTyping } from '@/lib/chatwoot';
import { logger } from '@/lib/logger';

// ============================================================
// Envio da resposta do agente ao Chatwoot, com indicador "digitando"
// e quebra em mensagens menores (porta simplificada do workflow 07).
// Delays reduzidos para caber no orçamento de 60s da função serverless.
// ============================================================

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Quebra o texto em blocos naturais (por parágrafo), agrupando até ~600 chars.
function splitMessage(text: string): string[] {
    const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

    const chunks: string[] = [];
    let current = '';
    for (const p of paragraphs) {
        if ((current + '\n\n' + p).length > 600 && current) {
            chunks.push(current);
            current = p;
        } else {
            current = current ? `${current}\n\n${p}` : p;
        }
    }
    if (current) chunks.push(current);
    // No máximo 4 blocos para não estourar o tempo da função.
    return chunks.length ? chunks.slice(0, 4) : [text];
}

// Delay de "digitação" proporcional ao tamanho, com teto baixo (serverless).
function typingDelayMs(text: string): number {
    const palavras = text.length / 4.5;
    const segundos = Math.min((60 * palavras) / 150, 5); // teto 5s
    return Math.round(segundos * 1000);
}

export async function enviarResposta(
    idConversa: number | string,
    texto: string
): Promise<void> {
    if (!texto || !texto.trim()) {
        logger.warn({ idConversa }, 'Resposta vazia — nada a enviar');
        return;
    }

    const chunks = splitMessage(texto);
    for (let i = 0; i < chunks.length; i++) {
        await toggleTyping(idConversa, 'on');
        await sleep(typingDelayMs(chunks[i]));
        await sendMessage(idConversa, chunks[i]);
        if (i < chunks.length - 1) await sleep(1000);
    }
    await toggleTyping(idConversa, 'off');
}
