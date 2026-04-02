# Referencia de deploy Hostinger - Utensilios

Data: 2026-04-01
Escopo: baseline de publicacao segura para o `Utensilios`

## 1. Artefatos gerados

Frontend para `public_html`:
- `docs/hostinger/ibg.utensilios.web-public_html.zip`

API para website Node no subdominio:
- `docs/hostinger/ibg.utensilios.api-hostinger.zip`

Script de regeneracao local:
- `docs/hostinger/build_hostinger_artifacts.ps1`

## 2. Estrategia atual recomendada

- frontend em `public_html`
- API em website Node separado no subdominio
- banco externo via `DATABASE_URL`
- healthcheck obrigatorio antes de liberar o frontend

## 3. Frontend

1. Abrir o File Manager do website principal.
2. Entrar em `public_html`.
3. Fazer backup do conteudo atual, se necessario.
4. Enviar `ibg.utensilios.web-public_html.zip`.
5. Extrair o ZIP diretamente dentro de `public_html`.
6. Confirmar que os arquivos ficaram na raiz de `public_html`, especialmente:
   - `index.html`
   - `.htaccess`
   - pasta `assets`

Observacao:
- o `.htaccess` e obrigatorio para fallback da SPA com Vue Router em history mode

## 4. API no subdominio

1. Criar ou confirmar o subdominio da API.
2. No hPanel, criar um website do tipo Node.js App para esse subdominio.
3. Enviar `ibg.utensilios.api-hostinger.zip`.
4. Usar como primeira tentativa a configuracao coerente com o projeto:
   - Node.js: `20.x` ou `22.x`
   - Package manager: `npm`
   - Entry file: `dist/src/server.js`
5. Cadastrar as variaveis de ambiente da API.
6. Fazer redeploy se qualquer variavel for alterada depois.

## 5. Variaveis de ambiente da API

Obrigatorias:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `PORT`

Conferencias obrigatorias:
- `DATABASE_URL` deve apontar para o banco correto
- `DATABASE_URL` deve manter o schema esperado para o projeto
- `CORS_ORIGINS` deve conter os dominios reais do frontend

## 6. Banco

- nao migrar automaticamente para banco da Hostinger sem decisao explicita
- continuar usando `DATABASE_URL` do ambiente escolhido para producao
- executar migrations de forma controlada antes do go-live

Fluxo recomendado:
1. configurar `DATABASE_URL`
2. subir API
3. validar `/health`
4. validar login
5. publicar frontend

## 7. Testes finais

Frontend:
- abrir o dominio publicado
- navegar para rotas internas protegidas apos login
- verificar se nao ha 404 em recarga de pagina

API:
- abrir `/health`
- confirmar retorno JSON com status `ok`
- testar login real pelo frontend

CORS:
- confirmar que chamadas do frontend para a API nao geram bloqueio no navegador

## 8. Observacao de seguranca

- nao publicar `.env` real
- nao versionar segredos
- saneamento de credenciais expostas em documentacao deve ser tratado em frente propria

## 9. Observacao sobre o pacote da API

O ZIP atual da API contem:
- `src`
- `db`
- `dist`
- `package.json`
- `package-lock.json`
- `knexfile.js`
- `.env.example`

O ZIP atual da API nao contem:
- `.env`
- `node_modules`
