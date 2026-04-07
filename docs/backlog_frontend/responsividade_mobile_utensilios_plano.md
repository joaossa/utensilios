# Plano de responsividade mobile - Utensilios

Atualizado em: 2026-04-06
Status: pesquisa concluida, sem alteracoes aplicadas no codigo

## Objetivo

Registrar um plano seguro de melhoria de aspecto mobile para o `Utensilios`, usando o projeto `Sarah.CatalogoSistemas` como referencia de UX responsiva em celulares, sem copiar cegamente solucoes legadas e sem quebrar a aplicacao atual.

## Escopo desta pesquisa

- projeto atual analisado:
  - `F:\DEVELOPER_Projects\SRC\Fonte\IBG\Utensilios\ibg.utensilios.web`
- projeto de referencia lido cirurgicamente:
  - `D:\DEVELOPER_Projects\SourceControl_NovaEstrutura\Sarah\_git\Sarah.CatalogoSistemas\Sarah.CatalogoSistemas.Web`
- regra desta frente:
  - nao aplicar alteracoes agora
  - primeiro consolidar tasks, backlog e ordem segura de execucao

## Arquivos de referencia lidos no Sarah.CatalogoSistemas

- `src/pages/Index.vue`
- `src/components/Sistemas.vue`
- `src/components/SistemasFavoritos.vue`
- `src/components/ListaSistemas.vue`
- `src/components/CardSistema.vue`
- `src/components/CardSistemaToolbar.vue`
- `src/components/Hero.vue`
- `src/components/IconeSistema.vue`
- `src/layouts/main.vue`
- `src/boot/configPlataforma.js`
- `quasar.conf.js`
- `src/index.template.html`

## Arquivos do Utensilios lidos para comparacao

- `src/views/DashboardView.vue`
- `src/views/LoginView.vue`
- `src/views/ItensView.vue`
- `src/views/ItensListView.vue`
- `src/views/MembrosView.vue`
- `src/views/MembrosListView.vue`
- `src/views/EmprestimosView.vue`
- `src/views/EmprestimosListView.vue`
- `src/views/HistoricoView.vue`
- `src/views/HistoricoListView.vue`
- `src/views/ItemImagensView.vue`
- `src/main.ts`
- `package.json`

## O que a referencia Sarah faz muito bem no mobile

### 1. Nao tenta encolher a grade desktop no celular

No `Sarah.CatalogoSistemas`, a experiencia desktop usa grade de cards, mas o mobile troca para um componente proprio de lista:

- desktop:
  - `Sistemas.vue`
  - `SistemasFavoritos.vue`
  - grid com `repeat(auto-fill, minmax(170px, 1fr))`
- mobile:
  - `ListaSistemas.vue`
  - `q-list` + `q-item` + acao lateral

Licao para o `Utensilios`:
- mobile bom nao e apenas "a mesma tabela em modo grid"
- em varias telas vale mais ter um bloco/lista mobile especifico e simples

### 2. O layout mobile privilegia alcance do polegar e fluxo vertical

Em `Index.vue`, a referencia organiza:

- busca fixa no topo
- categorias em abas compactas
- experiencia vertical, sem excesso de informacao por card
- scroll controlado dentro do painel ativo

Licao para o `Utensilios`:
- telas mobile devem reduzir ruido visual no topo
- pesquisa e acoes principais precisam ficar previsiveis e de facil alcance

### 3. A unidade visual se repete bastante

O projeto de referencia reaproveita muito bem poucos blocos:

- `Hero`
- `ListaSistemas`
- `CardSistema`
- toolbar do card

Licao para o `Utensilios`:
- hoje a aplicacao esta responsiva, mas repete muito CSS e markup entre telas
- a melhoria mais valiosa nao e "mais media query"
- e sim padronizar os blocos mobile recorrentes

### 4. O mobile recebe interacoes especificas

Em `ListaSistemas.vue`, o mobile ganha:

- `q-pull-to-refresh`
- item de lista com avatar + titulo + acao lateral
- menos hover
- menos dependencia de tooltip

Licao para o `Utensilios`:
- interacao mobile deve priorizar toque, leitura rapida e acoes objetivas
- comportamentos dependentes de hover ou excesso de icones por card precisam ser revistos com cuidado

### 5. A referencia economiza chrome visual

O `Sarah.CatalogoSistemas` usa:

- menos texto por bloco
- acoes pequenas e reconheciveis
- poucos elementos concorrendo pela atencao

Licao para o `Utensilios`:
- a aplicacao atual tem boa base visual, mas varios cabecalhos, cards e formularios ainda podem ganhar densidade melhor no celular

## O que NAO deve ser copiado literalmente da referencia

Esta parte e importante. O projeto de referencia tem UX mobile boa, mas usa tecnicas antigas ou especificas demais para o contexto dele.

### Nao copiar literalmente

- `this.$q.platform.is.mobile` como criterio global principal
- mixin global `isMobile` em `configPlataforma.js`
- alturas fixas como `height: calc(100vh - 195px)`
- logica de layout acoplada ao ambiente de execucao do sistema catalogado
- padroes de Vue 2 + Quasar 1 so porque funcionam visualmente

### Traducao correta para o Utensilios

- aproveitar a intencao da UX
- reimplementar com `Vue 3`, `Quasar 2`, `container queries`, `grid mode`, wrappers compartilhados e breakpoints mais previsiveis

## Diagnostico atual do Utensilios

## Pontos fortes atuais

- o projeto ja esta responsivo e utilizavel no celular
- as listas principais ja usam `q-table` com `grid` no mobile
- ha preocupacao real com largura, quebra de linha e acoes em telas estreitas
- formularios ja foram compactados e centralizados
- `DashboardView.vue` ja mostra um caminho mais moderno com `container queries`

## Pontos fracos estruturais encontrados

### 1. O padrao mobile esta muito espalhado

Ha repeticao forte entre:

- `ItensListView.vue`
- `MembrosListView.vue`
- `EmprestimosListView.vue`
- `HistoricoListView.vue`

E tambem entre:

- `ItensView.vue`
- `MembrosView.vue`
- `EmprestimosView.vue`
- `HistoricoView.vue`
- `ItemImagensView.vue`

Problema:
- melhorar uma tela nao melhora automaticamente as outras
- o risco de regressao cresce a cada ajuste manual

### 2. Falta um componente mobile de lista mais simples

Hoje varias listas do `Utensilios` usam:

- `q-table` no desktop
- `item` slot com `mobile-card` no celular

Isso funciona, mas ficou repetido e artesanal em cada modulo.

O Sarah mostra um caminho mais limpo:
- um componente dedicado para a experiencia mobile

### 3. Falta um shell compartilhado para formularios internos

Cabecalho, card, botoes, labels internos e espacamentos estao coerentes, mas ainda nao estao centralizados num padrao reutilizavel unico.

Consequencia:
- qualquer melhoria fina de densidade mobile precisa ser replicada em muitos arquivos

### 4. O Dashboard esta mais moderno que os modulos

`DashboardView.vue` ja usa `container queries`, enquanto a maioria dos modulos ainda depende de `@media` locais e muita repeticao de estilo.

Consequencia:
- a maturidade responsiva da base ainda nao esta nivelada

### 5. O Login pode melhorar em dispositivos baixos

`LoginView.vue` esta bom, mas:

- usa logo grande
- usa blocos visuais altos
- usa mais area vertical do que o necessario

Em celulares baixos ou quando o teclado abre, isso pode ficar mais apertado do que precisa.

### 6. `EmprestimosView.vue` e a tela mais sensivel

Ela concentra:

- formulario
- construcao de itens
- grade/lista interna
- validacoes
- resumo

Qualquer mudanca de responsividade ali deve entrar por ultimo, com mais cuidado.

## Direcao recomendada para o Utensilios

Em vez de perseguir "mais CSS por tela", a melhor linha para o `Utensilios` e:

1. criar primitives de layout mobile reutilizaveis
2. migrar primeiro as listas mais simples
3. depois migrar formularios
4. deixar `Emprestimos` por ultimo

## Tasks recomendadas

## Fase 0 - Guardrails antes de mexer

### `RSP-0001` - Congelar baseline visual mobile

Objetivo:
- criar uma baseline de comparacao antes de qualquer alteracao

Escopo:
- capturas e checklist manual para:
  - `Login`
  - `Dashboard`
  - `Itens/lista`
  - `Membros/lista`
  - `Emprestimos/lista`
  - `Historico/lista`
  - `Itens`
  - `Membros`
  - `Historico`
  - `Emprestimos`

Matriz minima:
- `360x800`
- `390x844`
- `412x915`
- `768x1024`

Pronto quando:
- existir baseline visual comparavel para nao "melhorar quebrando"

### `RSP-0002` - Criar checklist de validacao mobile por tela

Objetivo:
- transformar qualidade mobile em criterio objetivo

Checklist minimo:
- sem corte lateral
- sem scroll horizontal
- botoes de acao tocaveis
- cabecalho legivel
- campo com foco nao quebra layout
- modal cabe sem corte
- lista continua clara com 3 a 10 registros

## Fase 1 - Fundacao compartilhada

### `RSP-0101` - Extrair shell visual comum dos modulos internos

Objetivo:
- centralizar a estrutura repetida de:
  - `module-page`
  - `module-shell`
  - `module-header`
  - `panel-card`
  - botoes de acao

Arquivos impactados no futuro:
- praticamente todos os `src/views/*View.vue`, exceto talvez `LoginView.vue`

Ganhos esperados:
- consistencia
- menos retrabalho
- menor risco de regressao

Risco:
- baixo, se feito primeiro como extracao sem mudar comportamento

### `RSP-0102` - Criar wrapper responsivo compartilhado para listas CRUD

Objetivo:
- unificar a estrategia desktop + mobile das listas

Inspiracao correta da referencia:
- desktop com estrutura de grade/tabela
- mobile com componente/lista especifica, mais enxuta

Escopo esperado do wrapper:
- cabecalho de lista
- pesquisa
- total
- acoes principais
- area de no-data
- troca previsivel entre desktop e mobile

Risco:
- medio

Observacao:
- esse item e o equivalente estrutural mais importante derivado do `Sarah.CatalogoSistemas`

### `RSP-0103` - Criar composable utilitario de responsividade

Objetivo:
- parar de espalhar decisoes responsivas por tela

Exemplo de responsabilidades:
- `isXs`
- `isMobileCompact`
- `denseTable`
- `useSingleColumnActions`

Importante:
- nao copiar mixin global legado do Sarah
- fazer isso no estilo atual do projeto

### `RSP-0104` - Padronizar tokens mobile

Objetivo:
- consolidar medidas recorrentes

Padroes a unificar:
- borda de card
- altura minima de botao
- raio
- gap
- largura maxima de shell
- padding mobile

Resultado esperado:
- menos ajustes "no olho" por arquivo

## Fase 2 - Migracao das listas

### `RSP-0201` - Migrar `MembrosListView.vue` como piloto

Motivo:
- e uma lista simples
- tem baixo risco funcional
- serve para provar a nova primitive compartilhada

Objetivo visual:
- aproximar mais de uma lista mobile clara e tocavel
- reduzir o aspecto de "tabela transformada"

### `RSP-0202` - Migrar `ItensListView.vue`

Objetivo:
- aplicar o padrao aprovado no piloto

Atencao:
- preservar a acao de imagens sem poluir o card mobile

### `RSP-0203` - Migrar `HistoricoListView.vue`

Objetivo:
- reduzir ruido visual e consolidar o mesmo padrao de lista mobile

### `RSP-0204` - Migrar `EmprestimosListView.vue`

Objetivo:
- aplicar o mesmo padrao compartilhado, com foco em:
  - nome do membro
  - status
  - devolver em
  - acoes

Risco:
- medio

## Fase 3 - Migracao dos formularios

### `RSP-0301` - Padronizar cabecalhos internos dos formularios

Telas alvo:
- `ItensView.vue`
- `MembrosView.vue`
- `HistoricoView.vue`
- `ItemImagensView.vue`

Objetivo:
- deixar topo mais leve no celular
- aproximar o aspecto entre modulos

### `RSP-0302` - Padronizar blocos de formulario

Objetivo:
- alinhar:
  - labels internos
  - espacamentos
  - botoes
  - mensagens
  - ordem visual das acoes

Resultado esperado:
- menos variacao de densidade entre telas

### `RSP-0303` - Revisar ordem e hierarquia das acoes no mobile

Inspiracao da referencia:
- a acao principal e facil de localizar
- acoes secundarias nao competem com o foco principal

Aplicacao no `Utensilios`:
- revisar relacao entre:
  - `Salvar`
  - `Listar`
  - `Cancelar edicao`
  - `Excluir`

## Fase 4 - Telas especiais

### `RSP-0401` - Revisar `DashboardView.vue`

Objetivo:
- manter o caminho mais moderno ja iniciado
- consolidar o dashboard como referencia interna do projeto

Possiveis ajustes:
- densidade vertical em telas pequenas
- encaixe dos cards de areas principais
- altura percebida do bloco do usuario

### `RSP-0402` - Revisar `LoginView.vue` para telas baixas

Objetivo:
- preservar a identidade visual
- reduzir aperto vertical em:
  - aparelhos baixos
  - abertura de teclado
  - zoom de acessibilidade

Atencao:
- melhorar densidade sem desmontar o visual atual

### `RSP-0403` - Revisar `EmprestimosView.vue` por ultimo

Motivo:
- e a tela mais critica e mais sensivel da base atual

Foco:
- builder de itens
- quantidade
- resumo
- leitura do bloco selecionado no mobile

Risco:
- alto

Regra:
- so entrar aqui depois de wrapper de lista e shell compartilhado estarem maduros

## Fase 5 - Melhorias opcionais inspiradas na referencia

### `RSP-0501` - Avaliar pull-to-refresh nas listas mobile

Inspiracao:
- `ListaSistemas.vue`

Aplicacao recomendada:
- apenas em listas
- nao em formularios

Prioridade:
- baixa

### `RSP-0502` - Avaliar barra de pesquisa/acoes sticky no mobile

Inspiracao:
- `Hero` e cabecalho fixo do `Sarah.CatalogoSistemas`

Aplicacao recomendada:
- avaliar so depois de estabilizar as listas
- nao aplicar imediatamente em todas as telas

Prioridade:
- baixa

### `RSP-0503` - Avaliar navegacao mobile de alto alcance

Inspiracao:
- abas mobile fixas do `CatalogoSistemas`

Aplicacao recomendada:
- estudar apenas para o futuro
- nao copiar agora para o `Utensilios`, porque o fluxo e por modulos/rotas e nao por catalogo em abas

Prioridade:
- muito baixa

## Ordem segura de execucao

1. `RSP-0001`
2. `RSP-0002`
3. `RSP-0101`
4. `RSP-0102`
5. `RSP-0103`
6. `RSP-0104`
7. `RSP-0201`
8. validar
9. `RSP-0202`
10. `RSP-0203`
11. `RSP-0204`
12. `RSP-0301`
13. `RSP-0302`
14. `RSP-0303`
15. `RSP-0401`
16. `RSP-0402`
17. `RSP-0403`

## Piloto recomendado

Se for para aplicar depois com risco controlado, o melhor piloto e:

- `MembrosListView.vue`

Motivo:
- baixa complexidade
- bom volume de repeticao de padrao
- facil de medir melhora sem comprometer regra de negocio critica

## Backlog priorizado

## Adotar agora quando a implementacao comecar

- `RSP-0001`
- `RSP-0002`
- `RSP-0101`
- `RSP-0102`
- `RSP-0103`
- `RSP-0104`
- `RSP-0201`

## Adotar na segunda onda

- `RSP-0202`
- `RSP-0203`
- `RSP-0204`
- `RSP-0301`
- `RSP-0302`
- `RSP-0303`

## Deixar para depois

- `RSP-0401`
- `RSP-0402`
- `RSP-0403`
- `RSP-0501`
- `RSP-0502`
- `RSP-0503`

## Conclusao executiva

O `Utensilios` ja esta bom no celular. O principal ganho agora nao viria de mais remendos por tela, e sim de uma aproximacao mais estrutural ao que o `Sarah.CatalogoSistemas` faz bem:

- separar melhor a experiencia desktop da experiencia mobile
- usar blocos mobile dedicados e simples
- reduzir repeticao
- consolidar primitives de layout
- melhorar por ondas, nao por ataque direto em todos os modulos

Se a implementacao for autorizada depois, a recomendacao e comecar por fundacao compartilhada + `MembrosListView.vue` como piloto.
