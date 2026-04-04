# Guia simples de publicacao - Hostinger

Data: 2026-04-04
Projeto: IBG - Utensilios

Objetivo:
- publicar frontend e API no Hostinger sem repetir as falhas ja vividas
- manter uma linha simples, direta e comprovada

## 1. Arquitetura de publicacao

Frontend:
- dominio: `https://ibgutensilios.com.br`
- tipo: site estatico
- destino: `public_html`

API:
- dominio: `https://api.ibgutensilios.com.br`
- tipo: website Node.js separado
- banco: Neon via `DATABASE_URL`

## 2. O que a Hostinger faz no deploy da API

Na pratica, a Hostinger costuma:
- instalar dependencias com `npm`
- executar `npm run build`
- iniciar a aplicacao pelo `Arquivo de entrada`

Por isso, o projeto foi adaptado para:
- compilar TypeScript somente localmente
- nao depender de `tsc` no servidor
- usar `index.js` na raiz como entrypoint mais compativel

Motivo tecnico:
- ja vimos erro remoto como:

```text
error TS5058: The specified path does not exist: 'tsconfig.json'.
ERROR: Failed to build the application
```

- o codigo local estava correto, mas o ambiente gerenciado do Hostinger nao deve ser tratado como ambiente de build confiavel para TypeScript
- por isso o `build` remoto virou um passo controlado com log, e o artefato sobe com `dist` pronto

## 3. Build local correto

API local:

```powershell
cd F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.api
npm run build:ts
```

Frontend local:

```powershell
cd F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web
npm run build
```

Gerar os artefatos oficiais:

```powershell
cd F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios
powershell -ExecutionPolicy Bypass -File .\docs\hostinger\build_hostinger_artifacts.ps1
```

Arquivos esperados:
- `docs/hostinger/ibg.utensilios.web-public_html.zip`
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`

## 4. Como a API foi preparada para a Hostinger

`package.json` da API:

```json
{
  "main": "index.js",
  "scripts": {
    "build": "node hostinger-stage.js build",
    "build:ts": "tsc -p tsconfig.json",
    "postbuild": "node hostinger-stage.js postbuild",
    "prestart": "node hostinger-stage.js prestart",
    "start": "node hostinger-stage.js start && node index.js"
  }
}
```

`index.js` da API:

```js
require('dotenv/config')
require('./dist/src/server.js')
```

Motivo:
- `index.js` fica na raiz e funciona melhor como `Arquivo de entrada`
- `dist/src/server.js` continua sendo o runtime real da API
- `hostinger-stage.js` gera log para sabermos ate onde o pipeline chegou

## 5. Logs de diagnostico da API

Arquivos esperados na raiz da app Node apos o deploy:
- `hostinger-stages.log`
- `startup.log`

Eles servem para responder:
- o Hostinger executou `postinstall`?
- o Hostinger executou `build`?
- o Hostinger executou `prestart`?
- o `index.js` chegou a carregar `dist/src/server.js`?

Exemplo de log util:

```text
[2026-04-04T03:50:13.687Z] stage=build
cwd=/home/.../nodejs
node=v20.x
has DATABASE_URL=true
has JWT_SECRET=true
```

Exemplo de bootstrap:

```text
[2026-04-04T03:55:00.000Z] Bootstrap start
[2026-04-04T03:55:00.100Z] dist/src/server.js exists=true
[2026-04-04T03:55:00.300Z] dist/src/server.js required successfully
```

## 6. Variaveis da API na Hostinger

Cadastrar no painel sem aspas:

```dotenv
DATABASE_URL=postgresql://neondb_owner:SEU_TOKEN@ep-jolly-star-anfd30bg-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=SEU_SEGREDO_FORTE_DE_PRODUCAO
CORS_ORIGINS=https://ibgutensilios.com.br,https://www.ibgutensilios.com.br
WEB_BASE_URL=https://ibgutensilios.com.br
RECOVERY_PASSWORD_URL=https://ibgutensilios.com.br/recuperar-senha?token={token}
PORT=3001
```

Regras:
- nao usar a `JWT_SECRET` de desenvolvimento
- nao usar aspas no painel
- se mudar qualquer variavel, fazer novo deploy da API

## 7. Variavel do frontend

Arquivo:
- `ibg.utensilios.web/.env.production`

Conteudo:

```dotenv
VITE_API_BASE_URL=https://api.ibgutensilios.com.br
```

Motivo:
- o frontend nao pode apontar para `localhost`
- o Vite so expoe variaveis com prefixo `VITE_`

## 8. O que enviar para a Hostinger

Frontend:
- enviar `ibg.utensilios.web-public_html.zip`
- extrair em `public_html`

API:
- enviar `ibg.utensilios.api-hostinger.zip`
- configurar:
  - Node: `20.x`
  - Package manager: `npm`
  - Arquivo de entrada: `index.js`

## 9. Ordem correta de publicacao

1. Publicar a API primeiro.
2. Confirmar o healthcheck:

```text
https://api.ibgutensilios.com.br/health
```

Resposta esperada:

```json
{"status":"ok","system":"ibg-utensilios-api"}
```

3. So depois publicar o frontend.
4. Testar login em:

```text
https://ibgutensilios.com.br
```

## 10. Se algo falhar

Se `https://api.ibgutensilios.com.br/health` mostrar:
- `This Page Does Not Exist`

Entao o problema mais provavel nao e CORS. O problema costuma ser:
- app Node nao publicada no subdominio correto
- `Arquivo de entrada` errado
- deploy nao concluido
- processo nao iniciou

Se o navegador mostrar erro de CORS no frontend:
- primeiro validar `/health`
- depois validar `CORS_ORIGINS`
- depois validar se a API realmente esta no ar

Se surgir erro de build remoto:

```text
error TS5058: The specified path does not exist: 'tsconfig.json'
```

Conclusao:
- a Hostinger tentou rodar `npm run build`
- o servidor nao deve compilar nossa API com TypeScript
- manter a estrategia atual:
  - `build` remoto controlado
  - `build:ts` local
  - `index.js` como entrypoint

## 11. Checklist curto final

API:
- `index.js` como entrypoint
- variaveis sem aspas
- redeploy apos alterar variavel
- testar `/health`
- se falhar, abrir `hostinger-stages.log` e `startup.log`

Frontend:
- `VITE_API_BASE_URL=https://api.ibgutensilios.com.br`
- ZIP extraido em `public_html`
- confirmar `index.html`, `.htaccess` e `assets`

Regra de ouro:
- a API precisa responder `/health` antes de qualquer teste de login no frontend
