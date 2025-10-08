# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React/TypeScript frontend application for the EDM Vandalizações management system. It's a comprehensive platform for managing vandalism incidents, infractions, infractors, scrapyards, materials, and territorial entities (Regiões/ASC/PT) with analytics dashboards and reporting capabilities.

**Technology Stack:**
- React 19 with TypeScript
- Vite for development and building
- Axios for HTTP requests
- Auto-generated API clients from OpenAPI/Swagger specifications

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:5173
npm run build    # Type-check with tsc and build for production
npm run preview  # Preview production build locally
```

## Architecture Overview

### Component Architecture Pattern
**CRITICAL:** This project follows a strict component abstraction pattern where all UI components live in `src/components/` as the single source of truth. Screens must never import UI library primitives directly.

- **Components Directory Structure:**
  - `src/components/layout/` - Layout components (Container, Grid, Navbar, etc.)
  - `src/components/ui/` - Base UI components (Button, Card, Text, etc.)
  - `src/components/routing/` - Route protection components (PrivateRoute, AdminRoute)
  - `src/components/forms/` - Form components
  - `src/components/modals/` - Modal components
  - `src/components/index.ts` - Barrel exports for clean imports

### API Service Pattern
**DO NOT MODIFY AUTO-GENERATED FILES:**
- `src/services/api.ts` - Auto-generated API client
- `src/services/configuration.ts` - Auto-generated configuration
- `src/services/common.ts` - Auto-generated common utilities
- `src/services/docs/` - Auto-generated API documentation

Create custom service wrappers for extended functionality instead of modifying generated files.

### Project Structure
```
src/
├── components/          # Reusable UI components (single source of truth)
├── contexts/           # React contexts (AuthContext, ThemeContext)
├── screens/            # Page-level components (35+ screens)
├── services/           # API clients and HTTP services
├── utils/              # Utility functions and helpers
├── styles/             # Global CSS styles
└── main.tsx           # Application entry point
```

## Key Features & Screens

### Core Domain Screens
- **Ocorrências (Occurrences)** - Main incident management
- **Infrações (Infractions)** - Violation details and management
- **Infractores (Infractors)** - Person/entity management
- **Sucatas (Scrapyards)** - Scrapyard management with map integration
- **Materiais (Materials)** - Material catalog management
- **Instalações (Installations)** - Installation management
- **Ações (Actions)** - Action planning and tracking

### Administrative Screens
- **Utilizadores (Users)** - User management
- **Regiões (Regions)** - Regional management
- **ASCs** - ASC management
- **Setores de Infração** - Infraction sector configuration
- **Tipos de Infração** - Infraction type configuration
- **Formas de Conhecimento** - Knowledge source configuration

### Analytics & Reporting
- **Dashboard** - Main analytics dashboard
- **Instalações Dashboard** - Installation-specific metrics
- **Inspeções Dashboard** - Inspection analytics
- **Relatórios (Reports)** - Comprehensive reporting system

## Authentication & Security

### Authentication Flow
- Uses JWT tokens with automatic refresh
- Global 401/403 handling via axios interceptors
- Persistent authentication state in localStorage
- Automatic logout on session expiration

### Route Protection
Three-tier protection system:
1. **PublicRoute** - For login/public pages
2. **PrivateRoute** - Requires authentication
3. **AdminRoute** - Requires admin privileges

## Language & Localization

**Portuguese (pt-PT) is the primary language:**
- All UI text, error messages, and user-facing content in Portuguese
- Code identifiers (variables, functions, components) use English technical conventions
- Git commit messages can be in Portuguese using Conventional Commits format

## Development Guidelines

### When Working with Components
1. Always create or modify components in `src/components/`
2. Use barrel exports in `src/components/index.ts`
3. Screens should only import from `src/components`, never from UI libraries directly
4. Follow the existing naming conventions (PascalCase for components)

### When Working with API Integration
1. Never modify auto-generated API files
2. Create custom service wrappers for additional functionality
3. Use the existing authentication patterns from AuthContext
4. Handle errors consistently with the established patterns

### When Working with Forms and Tables
1. All tables must include filtering, sorting, and pagination
2. Implement search functionality where appropriate
3. Use consistent loading and error states
4. Follow the established form validation patterns

### When Working with Routing
1. Use the existing route protection patterns
2. Maintain consistent URL structure and navigation
3. Implement proper breadcrumb navigation for nested routes

## Common Patterns

### API Service Wrapper Example
```typescript
// Custom service wrapper pattern
import { api } from './api'
import { withTokenValidation } from '../utils/apiErrorHandler'

export const customService = {
  async getData() {
    return withTokenValidation(async () => {
      return await api.generatedMethod()
    })
  }
}
```

### Component Import Pattern
```typescript
// ✅ Correct - Import from components
import { Container, Heading, Button } from '../components'

// ❌ Incorrect - Never import UI library directly in screens
import { Box, Heading, Button } from '@chakra-ui/react'
```

## Configuration

### Environment Variables
- `VITE_API_BASE_URL` - API base URL for backend communication
- Development server runs on port 5173 by default

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured for clean imports (@components, @contexts, @screens, @utils, @services)
- ES2020 target with ESNext modules

## Testing

Currently no test framework is configured. When implementing tests, use:
- Vitest + React Testing Library
- Place tests as `*.test.ts(x)` near source files
- Target 80%+ coverage for critical modules

## Performance Considerations

- Use React 19 concurrent features where applicable
- Implement proper loading states for API calls
- Optimize table rendering with pagination
- Use proper memoization for expensive calculations

## Key Files to Understand

- `src/App.tsx` - Main application shell with authentication routing
- `src/contexts/AuthContext.tsx` - Central authentication management
- `src/components/index.ts` - Component exports and organization
- `AGENTS.md` - Repository guidelines and conventions
- `STRUCTURE.md` - Detailed architecture documentation
- `APP.md` - Domain and application description