# Design System

## Objetivo

Este documento descreve o design system aplicado na área privada desta aplicação.

Foi pensado para:

- criar interfaces institucionais modernas, quentes e sólidas
- evitar o aspeto genérico de dashboards brancos com cinzas frios
- dar consistência entre menu, cabeçalhos, cards, filtros, tabelas, mapas e gráficos
- servir como referência reutilizável noutras aplicações implementadas com Codex

Este sistema favorece:

- superfícies suaves e quentes
- contraste claro entre navegação e conteúdo
- hierarquia forte por tipografia e espaçamento
- interações discretas mas perceptíveis
- densidade útil sem parecer apertado

## Direção Visual

### Personalidade

O sistema deve parecer:

- institucional
- confiável
- contemporâneo
- sóbrio
- humano

Não deve parecer:

- genérico
- excessivamente minimalista
- “admin template”
- frio
- neon
- demasiado tecnológico

### Linguagem visual

- Fundo geral com tons areia, marfim e bege muito suave
- Sidebar escura em castanho profundo com contraste elegante
- Destaques em laranja queimado
- Cor secundária em teal/verde petróleo
- Vermelho controlado para perdas, risco e erro
- Bordas subtis, não agressivas
- Sombras suaves e largas, nunca duras

## Tokens Base

### Tipografia

- Fonte principal: `Manrope`
- Fallback: `'Segoe UI', sans-serif`

Regras:

- títulos com peso `800`
- subtítulos com peso `700`
- texto secundário com peso `500` a `600`
- labels e pequenos metadados com `700` e `letter-spacing` subtil

### Paleta

#### Neutros / superfícies

- `--color-bg: #f4f1ea`
- `--color-bg-strong: #ebe5d8`
- `--color-surface: rgba(255, 252, 247, 0.9)`
- `--color-surface-strong: #fffdf8`
- `--color-surface-muted: #f5efe3`
- `--color-border: rgba(101, 74, 32, 0.14)`
- `--color-border-strong: rgba(101, 74, 32, 0.24)`
- `--color-text: #1f2937`
- `--color-text-soft: #5f6673`
- `--color-text-muted: #7b8494`

#### Marca / ação

- `--color-primary: #c96d1f`
- `--color-primary-deep: #8d4a17`
- `--color-primary-soft: rgba(201, 109, 31, 0.12)`

#### Secundária / leitura analítica

- `--color-accent: #0f766e`
- `--color-danger: #b42318`

### Sombras

- `--shadow-soft: 0 12px 30px rgba(76, 57, 24, 0.08)`
- `--shadow-medium: 0 18px 40px rgba(76, 57, 24, 0.12)`

Princípio:

- usar sombras largas, difusas e quentes
- evitar sombras cinzentas muito escuras

### Raios

- `--radius-sm: 12px`
- `--radius-md: 18px`
- `--radius-lg: 24px`

Regras:

- inputs: `14px`
- pequenos botões/chips: `12px` a `14px`
- cards: `18px` a `24px`
- superfícies principais: `20px+`

### Espaçamento

- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-7: 32px`
- `--space-8: 40px`

Regras:

- gaps normais: `12px` a `16px`
- separação entre secções: `24px` a `32px`
- padding de cards grandes: `24px` a `32px`

## Estrutura de Layout

### Shell privada

A shell privada deve ter:

- `sidebar` fixa ou sticky
- área principal com `topbar/header`
- conteúdo com largura máxima controlada
- fundo geral com gradientes subtis

Princípios:

- a sidebar é o bloco de maior contraste
- o conteúdo vive sobre superfícies claras
- a área principal nunca deve colar às bordas do viewport

### Sidebar

O menu lateral deve usar:

- fundo castanho escuro em gradiente
- branding no topo com logo claro
- grupos visuais de navegação com superfícies discretas
- item ativo com gradiente claro quente
- rodapé com utilizador e logout

Regras:

- grupos podem colapsar, mas nunca devem ocupar altura artificial
- itens ativos devem ser claramente distinguíveis
- hover deve ser subtil, sem parecer botão HTML básico
- o logout deve seguir o mesmo sistema visual e nunca parecer “solto”

### Header da página

O cabeçalho da página deve incluir:

- `eyebrow` em uppercase
- título forte
- subtítulo curto
- badges de contexto se necessário

Padrão:

- fundo claro com gradiente suave
- borda fina quente
- raio grande
- sombra suave

## Componentes Base

### Cards

Os cards são o núcleo do sistema.

Devem usar:

- fundo claro quente
- borda subtil
- raio grande
- sombra larga e suave
- títulos fortes

Estados:

- `default`: superfície limpa
- `elevated`: sombra média
- `bordered`: mais discreto

Regra importante:

- nunca empilhar cards internos que rebentem o layout
- se houver dois painéis internos lado a lado, usar `gridTemplateColumns: repeat(auto-fit, minmax(0, 1fr))`
- para números longos, usar `overflowWrap: 'anywhere'`

### Card de filtros

O card de filtros é um padrão estável e não deve ser reinterpretado em cada ecrã.

Deve usar:

- o componente base `Card` sem fundo colorido especial
- fundo branco/quente neutro igual aos restantes cards de conteúdo
- título `Filtros`
- subtítulo curto a explicar o âmbito dos filtros
- ações no cabeçalho para `Mostrar/Ocultar filtros` e `Limpar filtros`
- estado inicial recolhido por defeito em listagens densas

Quando recolhido:

- mostrar uma faixa/resumo discreta com texto curto
- mostrar contagem de filtros ativos ou `Sem filtros ativos`
- nunca usar um fundo forte ou gradiente que faça o card parecer destacado face aos outros cards de conteúdo

Quando expandido:

- usar grelha responsiva com `repeat(auto-fit, minmax(220px, 1fr))`
- labels em uppercase discreto
- inputs e selects com o mesmo estilo base do sistema

Regra obrigatória:

- o card de filtros deve ser visualmente neutro e branco, não um bloco colorido
- variações cromáticas fortes ficam reservadas para destaques, métricas, alertas ou CTAs

### Card de resultados e listagens

O card de resultados também é um padrão estável.

Deve usar:

- título `Resultados` salvo quando o contexto exigir outro nome claro
- subtítulo curto e estável, preferencialmente `Lista paginada e ordenável.`
- a mesma estrutura base usada em `OcorrenciasScreen`
- tabela simples diretamente dentro do `Card`, sem shells decorativas extra
- no card de filtros associado, os botões `Mostrar/Ocultar filtros` e `Limpar filtros` devem usar o estilo de botão secundário institucional
- o card de resultados não deve ter fundos especiais, gradientes próprios, painéis internos adicionais ou ornamentos específicos por ecrã

Botões do cabeçalho de filtros:

- fundo `linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)`
- borda `1px solid rgba(101, 74, 32, 0.16)`
- texto `#8d4a17`
- peso `700`
- `minHeight: 42px`
- `padding: 0 16px`
- `borderRadius: 14px`
- `boxShadow: 0 8px 18px rgba(76, 57, 24, 0.08)`
- quando o estado estiver ativo, usar `border: 1px solid rgba(201, 109, 31, 0.28)`
- quando o estado estiver ativo, usar `background: linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)`
- quando o estado estiver ativo, usar `boxShadow: 0 12px 24px rgba(76, 57, 24, 0.10)`
- estes botões devem seguir literalmente o padrão de `secondaryActionButtonStyle` e `occTabButtonActiveStyle` do dashboard

Tabela:

- `overflowX: auto`
- `table` com `borderCollapse: 'collapse'`
- cabeçalhos com `padding: 12px 8px`
- borda inferior quente subtil `rgba(101, 74, 32, 0.12)`
- células com `padding: 12px 8px`
- linhas com borda inferior `rgba(101, 74, 32, 0.08)`
- coluna de ações alinhada ao padrão já usado em Ocorrências
- para ações simples de linha como `Ver detalhes`, preferir botão icon-only com `title` e `aria-label`, em vez de texto
- estes botões de ação devem seguir o mesmo padrão visual de `ActionIconButton` usado em `OcorrenciasScreen`

Elementos de apoio:

- chips de resumo acima da tabela podem existir no card de filtros
- badges em células podem existir para datas, estados ou valores
- a paginação deve usar sempre o componente `Pagination` do sistema

Regra obrigatória:

- novas telas de listagem devem copiar a estrutura de `OcorrenciasScreen` como baseline
- evitar criar wrappers visuais novos para a tabela sem necessidade funcional real
- quando uma listagem já existe, alinhar o card `Resultados` a esse mesmo padrão em vez de reinventar o cabeçalho ou a estrutura interna

### Telas de detalhe

As telas de detalhe devem seguir um padrão editorial estável, inspirado em `OcorrenciaDetailScreen`.

Devem usar:

- hero superior com `eyebrow`, título forte, subtítulo curto e ações principais
- ações com ícone e texto, usando o mesmo sistema visual dos botões institucionais
- um primeiro card `Dados gerais` com resumo visual e blocos de metadados
- secções com ícone, título, pequena descrição e conteúdo agrupado por contexto

Hierarquia:

- usar ícones para orientar leitura, não para decoração excessiva
- textos auxiliares curtos são desejáveis quando ajudam a enquadrar o bloco
- preferir 2 a 4 secções fortes em vez de muitos cartões pequenos sem hierarquia

Painéis pareados de contexto:

- quando existirem painéis lado a lado como `Localização` e `Sucatarias próximas`, ambos devem alinhar em altura
- se um painel contiver lista longa, a lista deve ter altura fixa equivalente ao mapa ou painel vizinho e `overflowY: auto`
- para mapas de detalhe, usar altura estável de referência `360px`, salvo necessidade funcional clara
- o bloco do mapa pode incluir chips de contexto e uma legenda discreta, usando o mesmo sistema visual dos chips institucionais
- quando houver entidades próximas listadas ao lado do mapa, apresentar a distância à entidade principal no mapa e na listagem
- em listas de entidades próximas, preferir um resumo compacto com nome + distância, evitando metadados excessivos sem necessidade operacional
- o marker principal deve usar uma cor própria e estável, distinta dos markers secundários
- quando os markers secundários representam proximidade, usar uma escala cromática coerente em que a maior proximidade se aproxime do vermelho e os mais distantes usem tons mais quentes/claros

### Botões

Existem dois estilos principais:

#### Botão secundário institucional

Usado para:

- limpar filtros
- ver detalhes
- ações auxiliares

Visual:

- fundo `linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)`
- borda `1px solid rgba(101, 74, 32, 0.14~0.16)`
- texto `#8d4a17`
- peso `700`
- raio `12px` a `14px`
- sombra leve

#### Botão ativo / destaque

Usado para:

- seleção forte
- estados ativos do menu
- CTA de navegação principal

Visual:

- gradiente com laranja quente
- texto branco ou escuro de alto contraste
- sombra ligeiramente maior

#### Botão de ação destrutiva

Usado para:

- eliminar registos
- confirmar remoções permanentes
- ações irreversíveis

Visual:

- usar a cor de perigo do sistema e nunca um vermelho genérico do browser
- em contexto de tabela, manter o mesmo tamanho e geometria dos restantes botões de ação
- estado normal com fundo claro/neutro e destaque cromático controlado no texto e borda
- hover com fundo vermelho muito suave, borda reforçada e sombra discreta

Regra obrigatória:

- ações destrutivas não devem parecer links de texto nem botões HTML default
- o contraste deve comunicar risco sem “gritar” visualmente mais do que o necessário

### Inputs e selects

Todos os inputs devem seguir o mesmo padrão:

- fundo branco quente
- borda discreta quente
- foco com anel laranja suave
- raio médio

Nunca usar:

- bordas cinzentas frias isoladas
- `select` com estilo totalmente default do browser sem enquadramento

### Chips e badges

Usar chips para:

- contexto ativo
- filtros aplicados
- legendas do mapa
- estado da secção

Visual:

- formato `pill`
- fundo areia quente
- borda subtil
- texto pequeno mas forte

## Tabelas

As tabelas devem seguir o sistema.

Regras:

- cabeçalhos com peso `700`
- linhas com separadores subtis
- texto secundário em `#7b8494`
- ações em botões institucionais, nunca texto cru

### Botões dentro da tabela

Exemplo correto:

- altura mínima ~`38px`
- padding horizontal consistente
- fundo claro quente
- borda subtil
- raio `12px`
- sombra leve

Para ações destrutivas na tabela:

- manter a mesma largura/altura visual dos botões de ver/editar
- usar variante `danger` coerente com o sistema
- hover com reforço vermelho suave e não com fundo sólido agressivo

### Confirmação de eliminação

A confirmação de eliminação é um padrão obrigatório do sistema.

Nunca usar:

- `window.confirm`
- `alert`
- popups nativos do browser

Deve usar:

- modal próprio com `backdrop` escurecido e `blur` subtil
- card central com fundo quente claro, borda quente subtil e sombra larga
- `eyebrow` de confirmação em pill discreta
- título forte com verbo claro como `Eliminar ação`, `Eliminar ocorrência`, etc.
- texto curto a explicar que a remoção é definitiva
- botões `Cancelar` e `Eliminar` no rodapé, alinhados à direita
- estado de loading no botão destrutivo
- mensagem de erro dentro do modal quando a operação falhar

Regras:

- o botão destrutivo do modal deve usar a variante `danger` do sistema
- o botão de cancelar deve usar o estilo secundário institucional
- o modal deve reutilizar o mesmo padrão visual em todas as listagens e detalhes com remoção
- se possível, incluir no texto o nome/descrição curta do registo que será eliminado

## Gráficos

### Princípios

Os gráficos devem parecer parte do sistema, não widgets externos.

Por isso:

- usar a mesma paleta
- usar os mesmos neutros quentes
- tooltips com o mesmo fundo dos cards
- legendas com a mesma tipografia e bordas

### Paleta recomendada para gráficos

- laranja: `#c96d1f`
- teal: `#0f766e`
- vermelho: `#b42318`
- castanho quente: `#8d4a17`
- verde musgo: `#5f8a57`
- laranja queimado escuro: `#c2410c`

### Donut charts

Regras:

- anel exterior com fundo quente claro
- centro branco quente
- legenda lateral consistente
- hover com ligeiro destaque de segmento
- aceitar `valueFormatter` quando o valor não for uma contagem simples

Muito importante:

- gráficos de dinheiro devem formatar com moeda
- gráficos de contagem podem usar `toLocaleString('pt-PT')`

### Séries temporais

Regras:

- grids discretas em bege claro
- linhas em vermelho e teal
- áreas preenchidas com gradientes muito suaves
- tooltip com fundo de card
- eixo e labels com neutros suaves

### Barras / distribuições

Regras:

- fundo da barra em bege claro
- barra preenchida com gradiente da cor principal do item
- labels legíveis e fortes

## Mapas

O mapa deve seguir o sistema e não destoar.

Regras:

- aplicar `styles` do Google Maps com neutros quentes
- água em teal muito suave
- estradas claras
- administrativos discretos

Marcadores:

- sucatarias: vermelho `#b42318`
- ocorrências: teal `#0f766e`
- stroke claro `#fffaf2`

Contentor do mapa:

- raio grande
- borda subtil
- sombra suave
- legenda em chips do sistema

## Animação e Feedback

O sistema usa animação curta, discreta e útil.

### Quando animar

- seleção de cards analíticos
- entrada do bloco de detalhe
- hover em cards
- abertura de drawer/menu mobile

### Como animar

- duração entre `160ms` e `420ms`
- curvas `ease` suaves ou `cubic-bezier(.2,.8,.2,1)`
- deslocamentos curtos (`translateY`)
- escala muito subtil (`1.01` a `1.015`)

Nunca usar:

- animações longas
- bounce exagerado
- microinterações em excesso

## Regras de Implementação com Codex

Quando quiseres usar este sistema noutra app, pede ao Codex algo como:

> “Implementa uma shell privada com este design system: fundo quente claro, sidebar castanha premium, acento laranja queimado, secundária teal, cards com raio grande, sombras suaves e gráficos/tabelas coerentes com o mesmo sistema.”

Ou:

> “Usa o `DESIGN-SYSTEM.md` como fonte de verdade para layout, shell privada, cards, filtros, tabelas, mapa e gráficos.”

### O que Codex deve preservar

- mesma paleta base
- mesma hierarquia tipográfica
- mesma lógica de superfícies
- mesma linguagem de botões
- consistência entre sidebar, header, cards e analytics

### O que Codex pode adaptar

- nomes dos módulos
- rotas
- conteúdo dos cards
- domínios do negócio
- datasets dos gráficos

## Anti-padrões

Evitar sempre:

- branco puro + cinza puro + azul default
- botões com aspeto HTML default
- tabelas frias sem integração visual
- gráficos com paleta aleatória
- mapas com estilo default quando toda a app já tem identidade
- excesso de gradients fortes
- usar muitas cores saturadas ao mesmo tempo
- boxes demasiado pequenas para números monetários longos

## Checklist rápido

Antes de fechar uma tela, confirmar:

- a tela parece pertencer à mesma app?
- os filtros usam o mesmo visual?
- os botões seguem o mesmo estilo?
- os gráficos usam a mesma paleta?
- o mapa não parece “importado de outro produto”?
- os cards têm espaço suficiente para conteúdo longo?
- os estados ativos e hover são claros?
- o utilizador percebe o que mudou após clicar?

## Ficheiros de referência nesta app

Os principais pontos de implementação deste sistema estão em:

- [global.css](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/styles/global.css)
- [AppShell.tsx](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/components/layout/AppShell.tsx)
- [SidebarGroups.tsx](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/components/layout/SidebarGroups.tsx)
- [Card.tsx](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/components/ui/Card.tsx)
- [DashboardScreen.tsx](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/screens/DashboardScreen.tsx)
- [TerritoryInsightsScreen.tsx](/Users/afonso.junior/Documents/local/edm_v2_frontend/src/screens/TerritoryInsightsScreen.tsx)

## Nota final

Este design system não é um kit visual abstrato. É um sistema pragmático para dashboards privados e aplicações operacionais.

Se for reutilizado noutras apps, a prioridade deve ser:

1. manter a coerência estrutural
2. manter a paleta e a linguagem de superfícies
3. adaptar o conteúdo ao domínio sem perder a identidade
