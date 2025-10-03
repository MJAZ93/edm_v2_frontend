# Repository Guidelines

## Idioma do Projeto
- Sempre usar Português (pt-PT) para interfaces, textos exibidos ao utilizador, documentação e mensagens de erro.
- Mensagens de commit e descrições de PR podem ser em Português. Os tipos do Conventional Commits (feat, fix, chore, etc.) permanecem em inglês.
- Identificadores de código (nomes de variáveis, funções e componentes) seguem convenções em inglês técnico, mas todo o conteúdo de UI deve estar em Português.

## Project Structure & Module Organization
- Source: `src/` with `components/` (layout, ui, routing, forms, modals), `contexts/`, `screens/`, `utils/`.
- Entry points: `index.html`, `src/main.tsx`, `src/App.tsx`.
- Services: `src/services/` contains generated and core API clients. Do not modify this directory.
- Docs: `STRUCTURE.md` (architecture) and `APP.md` (domain/app description).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR at `http://localhost:5173`.
- `npm run build`: Type-check (`tsc`) and create production build with Vite.
- `npm run preview`: Preview the production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript + React Functional Components.
- Indentation: 2 spaces; prefer explicit types for public APIs.
- Naming: `PascalCase` for components (`Button.tsx`), `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for env vars.
- Files: components live under `src/components/<group>/<Name>.tsx`; barrel exports in `src/components/index.ts`.
- UI Abstraction: Screens import from `src/components` instead of UI libraries directly.

## Testing Guidelines
- Current status: No test harness configured.
- Recommendation: use Vitest + React Testing Library. Name tests `*.test.ts(x)` near source or under `__tests__/` mirroring paths.
- Example: `src/components/ui/__tests__/Button.test.tsx`.
- Coverage: target 80%+ for critical modules when tests are introduced.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (e.g., `feat: add UsersScreen skeleton`, `fix: correct barrel exports`). Keep commits focused.
- PRs: include concise description, screenshots for UI changes, and link related issues. Ensure `build` passes locally before requesting review.
- Branching: `feat/…`, `fix/…`, `chore/…` prefixes recommended.

## Security & Configuration Tips
- Never commit secrets. Prefer `.env` (Vite uses `VITE_`-prefixed vars). Example: `VITE_API_BASE_URL`.
- Do not change `src/services/` manually; add wrappers elsewhere if needed.
- Validate inputs on screens; handle errors via utilities in `src/utils/`.

## Architecture Overview
- Follow `STRUCTURE.md`: components as a single source of truth, screens compose components, contexts manage global state, routing guards in `components/routing`.
- Keep implementations minimal and consistent; prioritize maintainability and clear boundaries.

## Tabelas: Filtros, Ordenação e Paginação
- Todas as tabelas/listagens devem incluir filtros visíveis e ordenação por colunas relevantes.
- Filtros: pelo menos um campo de pesquisa por nome/termo; adicionar filtros específicos do domínio (ex.: Região, Setor) quando aplicável. Quando a API suportar filtros, enviar os parâmetros; caso contrário, aplicar filtragem local sobre os dados carregados sem quebrar a paginação.
- Ordenação: cabeçalhos clicáveis que alternam `asc`/`desc`, com indicação visual (▲/▼). Quando a API suportar, enviar `order_by` e `order_direction`; se não suportar, ordenar localmente.
- Paginação: incluir seletor de tamanho de página (ex.: 10/20/50) e controlos Anterior/Seguinte. Ao alterar filtros, tamanho de página ou ordenação, reiniciar a página para 1.
