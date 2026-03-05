# Instruções de Deploy - Paris Imóveis

## Deploy Automático na Vercel

O projeto está configurado para deploy automático na Vercel através da integração com GitHub.

### Configuração do Deploy Automático:

1. Acesse [Vercel.com](https://vercel.com) e faça login
2. Clique em "New Project" ou "Novo Projeto"
3. Importe o repositório `https://github.com/Hoolydev/paris2`
4. Configure as variáveis de ambiente necessárias:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. O deploy será automático a cada push na branch `main`

### Variáveis de Ambiente Necessárias:

As variáveis já estão configuradas no arquivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://mymjayjpqxwxeyuyxyci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bWpheWpwcXh3eGV5dXl4eWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjc5MzEsImV4cCI6MjA4NzYwMzkzMX0.n_wJgsZDeED3Th3SmIcFMjZrESlHlYh7itMIpC5cdE0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bWpheWpwcXh3eGV5dXl4eWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNzkzMSwiZXhwIjoyMDg3NjAzOTMxfQ.taa_xAu9K0Exfj_cPNrH6K-QRlBxMDhpi5ZdnWG3xtM
```

### Arquivos de Configuração:

- `vercel.json`: Configuração do deploy na Vercel
- `next.config.ts`: Configuração do Next.js
- `tsconfig.json`: Configuração do TypeScript

### Comandos de Desenvolvimento:

```bash
npm run dev      # Iniciar servidor de desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar servidor de produção
```

### Funcionalidades Implementadas:

✅ Sistema de filtros funcionais com botão de aplicar
✅ Categorias múltiplas para imóveis
✅ Interface responsiva
✅ Upload de imagens
✅ Sistema de autenticação para admin
✅ Integração com Supabase

### Notas:

- O projeto já está com o repositório Git configurado
- O push automático para `main` dispara o deploy na Vercel
- Todas as dependências estão atualizadas no `package.json`