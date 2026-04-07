# Fontes Publicas e GitHub

Atualizado em: 2026-04-04
Objetivo: registrar as referencias externas usadas para cruzar a leitura local da base Sarah

## 1. Documentacao oficial priorizada

### Vue

- Vue Style Guide - regras essenciais:
  - https://vuejs.org/style-guide/rules-essential.html
  - reforca:
    - nome multi-palavra para componentes
    - props detalhadas
    - `key` em `v-for`
- Vue Composables:
  - https://vuejs.org/guide/reusability/composables.html
  - reforca o uso de composables para encapsular logica com estado
- Vue Testing:
  - https://vuejs.org/guide/scaling-up/testing.html
  - reforca comecar os testes cedo e distribuir estrategia entre unit, component e e2e
- Vue Performance:
  - https://vuejs.org/guide/best-practices/performance
  - reforca:
    - escolher arquitetura certa
    - lazy loading de rotas
    - bundle menor
    - evitar abstrações desnecessarias

### Pinia

- Pinia Core Concepts:
  - https://pinia.vuejs.org/core-concepts/
  - reforca:
    - store com `state`, `getters`, `actions`
    - convencao `use...Store`
    - clareza entre Option Store e Setup Store

### Quasar

- Quasar Boot Files:
  - https://quasar.dev/quasar-cli-vite/boot-files/
  - reforca o uso de arquivos de boot para inicializacao limpa em projetos CLI/Vite
- Quasar Table:
  - https://quasar.dev/vue-components/table/
  - reforca:
    - `dense`
    - `grid`
    - `visible-columns`
    - `virtual scroll`
- Quasar Screen Plugin:
  - https://quasar.dev/options/screen-plugin/
  - reforca:
    - uso de `$q.screen`
    - preferencia por classes/CSS responsivo quando possivel
- Quasar Breakpoints:
  - https://quasar.dev/style/breakpoints/
  - reforca os ranges padrao `xs`, `sm`, `md`, `lg`, `xl`

### Vite

- Vite Env and Mode:
  - https://vite.dev/guide/env-and-mode
  - reforca:
    - `import.meta.env`
    - apenas `VITE_*` vai para o cliente
    - segredos nao devem usar prefixo `VITE_`

### TanStack Query

- TanStack Query Vue Overview:
  - https://tanstack.com/query/latest/docs/framework/vue/overview
  - reforca:
    - cache
    - sincronizacao de estado remoto
    - diferenciacao entre estado de servidor e estado do cliente

### Testes E2E e responsividade

- Playwright Best Practices:
  - https://playwright.dev/docs/best-practices
  - reforca:
    - testar comportamento visivel ao usuario
    - isolar testes
    - usar locators robustos
    - nao testar dependencias de terceiros
- web.dev Learn Responsive Design:
  - https://web.dev/learn/design/
  - reforca a visao moderna de responsividade, alem de media queries
- MDN Container Queries:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
  - reforca quando componentes devem responder ao container e nao apenas ao viewport

## 2. GitHub publico usado como referencia complementar

### Vue + Vite

- `vuejs/create-vue`
  - https://github.com/vuejs/create-vue
  - utilidade:
    - confirma que `create-vue` e a forma recomendada para iniciar um projeto Vue com Vite
    - ajuda a manter o pensamento alinhado ao ecossistema atual

### Vue + Quasar + Pinia + TS

- `CharlieDigital/vue3-pinia-quasar-ts`
  - https://github.com/CharlieDigital/vue3-pinia-quasar-ts
  - utilidade:
    - exemplo publico enxuto de `Vue 3 + Vite + Pinia + Quasar + TypeScript`
    - bom como scaffold mental de organizacao de projeto

## 3. Observacao sobre outras fontes publicas

Foram feitas buscas em outras bases abertas para ampliar o contexto. Na pratica:

- as melhores referencias tecnicas para decisoes de arquitetura vieram das docs oficiais
- os exemplos mais proximos do nosso stack vieram de GitHub publico e da propria base Sarah
- materiais publicos mais genericos, inclusive de outras plataformas de IA e engenharia, foram menos uteis que a combinacao:
  - docs oficiais
  - repositos publicos focados no stack Vue/Quasar
  - codigo real da base Sarah

## 4. Como usar estas fontes daqui para frente

- para decisao de framework:
  - usar sempre docs oficiais
- para padrao de estrutura:
  - cruzar docs oficiais com `Sarah.Componentes.*` e `Sarah.SIH.*` modernos
- para responsividade:
  - validar com Quasar docs + web.dev + MDN
- para testes:
  - validar com Vue Testing + Vitest + Playwright

