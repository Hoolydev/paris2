import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { logger } from './logger';

// ============================================================
// Autenticação Google via Service Account (substitui o OAuth do n8n).
// A chave JSON da Service Account é lida do env em base64.
// Compartilhe o calendário com o client_email da SA para dar acesso.
// ============================================================

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let _jwt: JWT | null = null;

function loadServiceAccount(): { client_email: string; private_key: string } {
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
    if (!b64) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 não definido.');
    }
    let parsed: any;
    try {
        parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    } catch (err) {
        logger.error({ err: String(err) }, 'Falha ao decodificar Service Account base64');
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 inválido (não é base64 de um JSON).');
    }
    if (!parsed.client_email || !parsed.private_key) {
        throw new Error('Service Account JSON sem client_email/private_key.');
    }
    return parsed;
}

export function getGoogleJWT(): JWT {
    if (_jwt) return _jwt;
    const sa = loadServiceAccount();
    _jwt = new JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: SCOPES,
    });
    return _jwt;
}

export function getCalendarClient() {
    return google.calendar({ version: 'v3', auth: getGoogleJWT() });
}
