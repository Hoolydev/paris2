import pino from 'pino';

// Logger estruturado (Pino). Em produção na Vercel sai como JSON nos logs.
// Nunca usar console.log direto — sempre este logger.
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: undefined, // remove pid/hostname (ruído nos logs serverless)
});

export type Logger = typeof logger;
