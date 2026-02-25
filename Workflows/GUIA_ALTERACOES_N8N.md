# Guia de Alterações nos Workflows N8N

Este guia detalha as alterações **passo a passo** que devem ser feitas no n8n para migrar do Google Drive para o Supabase Storage.

---

## 1. Workflow 02 — Substituir pelo novo

### Ação
Importar o novo arquivo `## 02. Baixar e enviar imagem do Supabase.json` no n8n, substituindo o workflow antigo.

### Diferenças

| Antes (Google Drive) | Depois (Supabase) |
|---|---|
| Parâmetro de entrada: `file_id` | Parâmetro de entrada: `image_url` |
| Nó `googleDrive` (download por ID) | Nó `httpRequest` GET (download por URL) |
| Credencial: `Google Drive OAuth` | Sem credencial (URLs públicas) |

### Configurar credencial
- O nó **Enviar imagem** (Chatwoot) precisa da credencial `chatwootApi` configurada
- O nó **Baixar imagem** NÃO precisa de credencial (as URLs do Supabase são públicas)

---

## 2. Workflow 01 — Nó "Listar arquivos" → "Buscar imóveis"

### Localização no workflow
Posição visual: `[3488, 1456]` — é um dos tools conectados ao agente "Secretária v3"

### Ação
**Substituir** o nó `googleDriveTool` por um nó `httpRequestTool`:

1. **Deletar** o nó "Listar arquivos" existente
2. **Criar** um novo nó do tipo **HTTP Request Tool** (`n8n-nodes-base.httpRequestTool`)
3. **Configurar** assim:

| Campo | Valor |
|---|---|
| **Nome** | `Buscar imóveis` |
| **Descrição** | `Busca imóveis disponíveis no catálogo. Pode filtrar por tipo (Apartamento, Casa, Terreno, etc.), bairro, número mínimo de quartos, preço mínimo e máximo. Use sem parâmetros para listar todos os imóveis.` |
| **Method** | `GET` |
| **URL** | `{{ $('Info').item.json.url_api }}/api/properties/search` |
| **Query Parameters** | Todos opcionais, vindos do `$fromAI()`: |

### Query Parameters (todos opcionais)

| Nome | Valor | Fonte AI |
|---|---|---|
| `type` | `={{ $fromAI('type', 'Tipo do imóvel: Apartamento, Casa, Terreno, Sala Comercial, etc.', 'string') }}` | Tipo |
| `neighborhood` | `={{ $fromAI('neighborhood', 'Bairro desejado', 'string') }}` | Bairro |
| `bedrooms` | `={{ $fromAI('bedrooms', 'Número mínimo de quartos', 'string') }}` | Quartos |
| `minPrice` | `={{ $fromAI('minPrice', 'Preço mínimo em reais', 'string') }}` | Preço min |
| `maxPrice` | `={{ $fromAI('maxPrice', 'Preço máximo em reais', 'string') }}` | Preço max |
| `query` | `={{ $fromAI('query', 'Busca por texto livre no título, descrição ou localização', 'string') }}` | Texto livre |

4. **Conectar** esta tool ao nó agente "Secretária v3" na saída `ai_tool`

---

## 3. Workflow 01 — Nó "Enviar arquivo" → "Enviar foto do imóvel"

### Localização no workflow
Posição visual: `[3616, 1456]` — tool workflow conectado ao agente

### Ação
**Atualizar** o nó existente `toolWorkflow`:

1. **Renomear** para `Enviar foto do imóvel`
2. **Atualizar a descrição** para:
   ```
   Utilize essa ferramenta para enviar uma foto de um imóvel para o cliente.
   Passe a URL da imagem retornada pela ferramenta "Buscar imóveis".
   ```
3. **Apontar** para o novo Workflow 02 (`## 02. Baixar e enviar imagem do Supabase`)
4. **Atualizar os parâmetros de entrada**:

| Antes | Depois |
|---|---|
| `file_id` (do `$fromAI`) | `image_url` (do `$fromAI('image_url', 'URL da imagem a ser enviada', 'string')`) |
| `id_conta` (do `$('Info')`) | `id_conta` (manter igual) |
| `id_conversa` (do `$('Info')`) | `id_conversa` (manter igual) |
| `url_chatwoot` (do `$('Info')`) | `url_chatwoot` (manter igual) |

---

## 4. Workflow 01 — Nó "Info" — Adicionar URL da API

### Localização
O nó "Info" é o primeiro nó `Set` do workflow, onde são configuradas variáveis globais.

### Ação
**Adicionar** um novo campo:

| Nome | Valor | Tipo |
|---|---|---|
| `url_api` | `https://SEU-DOMINIO.vercel.app` (ou `http://localhost:3000` para testes) | `string` |

> ⚠️ **Trocar pelo domínio real em produção!**

---

## 5. Workflow 01 — System Prompt do Agente

### Localização
Nó "Secretária v3" na posição `[3776, 1120]` → campo `systemMessage`

### Ações necessárias

O prompt atual é para uma **clínica médica**. Precisa ser reescrito para a **Paris Imobiliária**. As seções que devem ser alteradas:

#### 5.1 — Seção PAPEL
Trocar "Maria, secretária da Clínica Oliveira" pelo nome e papel para a imobiliária.

#### 5.2 — Seção CONTEXTO
Substituir informações da clínica (horários, endereço, profissionais) por informações da imobiliária.

#### 5.3 — Seção FERRAMENTAS
Substituir a referência a `Listar_arquivos` e `Baixar_e_enviar_arquivo` por:

```xml
### Buscar_imoveis

<ferramenta id="Buscar_imoveis">
  **Uso**: Buscar imóveis disponíveis no catálogo.
  **Parâmetros opcionais**:
    * type: Tipo do imóvel (Apartamento, Casa, Terreno, etc.)
    * neighborhood: Bairro
    * bedrooms: Número mínimo de quartos
    * minPrice: Preço mínimo
    * maxPrice: Preço máximo
    * query: Texto livre
  **Retorno**: Lista de imóveis com título, preço, localização e URLs de fotos
  **Importante**: Apresente no máximo 3 imóveis por vez
</ferramenta>

### Enviar_foto_imovel

<ferramenta id="Enviar_foto_imovel">
  **Uso**: Enviar uma foto de imóvel ao cliente via WhatsApp
  **Parâmetro**: URL da imagem (obtida via Buscar_imoveis)
  **Importante**: Envie apenas uma foto por vez. Pergunte se o cliente quer ver mais fotos.
</ferramenta>
```

#### 5.4 — Seção FLUXO (sugestão para imobiliária)

```
1. Cumprimentar e perguntar o que o cliente procura
2. Identificar tipo de imóvel, bairro, faixa de preço, quartos
3. Buscar imóveis com a ferramenta "Buscar_imoveis"
4. Apresentar 2-3 opções ao cliente
5. Enviar fotos com "Enviar_foto_imovel" quando solicitado
6. Agendar visita se o cliente tiver interesse
7. Escalar para humano em casos complexos
```

---

## Checklist de Implementação

- [ ] Importar novo Workflow 02 no n8n
- [ ] Configurar credencial Chatwoot no Workflow 02
- [ ] Substituir nó "Listar arquivos" → "Buscar imóveis" (httpRequestTool)
- [ ] Atualizar nó "Enviar arquivo" → "Enviar foto do imóvel"
- [ ] Adicionar `url_api` no nó "Info"
- [ ] Reescrever system prompt do agente para imobiliária
- [ ] Testar busca de imóveis via workflow
- [ ] Testar envio de foto via Chatwoot
- [ ] Deploy da API Next.js (para que o n8n tenha acesso ao endpoint)
