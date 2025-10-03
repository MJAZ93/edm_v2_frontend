# Modern React Application Architecture Guide

This document provides a comprehensive guide to building modern, scalable React applications based on the "Octopus" monitoring platform architecture. This structure has proven to be highly maintainable, developer-friendly, and scalable for complex enterprise applications.

## Table of Contents

1. [Core Technology Stack](#core-technology-stack)
2. [Project Structure](#project-structure)
3. [Architecture Principles](#architecture-principles)
4. [Component Organization](#component-organization)
5. [API Integration Patterns](#api-integration-patterns)
6. [Authentication & Authorization](#authentication--authorization)
7. [Routing Architecture](#routing-architecture)
8. [State Management](#state-management)
9. [UI Design Patterns](#ui-design-patterns)
10. [Development Workflow](#development-workflow)
11. [Implementation Examples](#implementation-examples)

## Core Technology Stack

### Foundation Technologies
- **React 19** - Latest React with concurrent features and improved server components
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool with HMR and optimized production builds
- **React Router DOM v7** - Modern client-side routing with data loading

### UI & Styling
- **Chakra UI v2** - Comprehensive component library with excellent theming
- **Framer Motion** - Smooth animations and micro-interactions
- **React Icons** - Comprehensive icon library

### HTTP & API
- **Axios** - HTTP client with interceptors and automatic request/response transformation
- **OpenAPI/Swagger Integration** - Auto-generated API clients from backend specifications

### Additional Features
- **Firebase** - Push notifications and real-time features
- **Recharts** - Data visualization for analytics dashboards
- **React DatePicker** - Advanced date/time selection components

### Development Setup
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Project Structure

### High-Level Directory Organization

```
src/
├── components/          # Reusable UI components (single source of truth)
│   ├── layout/         # Layout-specific components
│   ├── ui/            # Base UI components
│   ├── routing/       # Route protection components
│   ├── forms/         # Form components
│   ├── modals/        # Modal components
│   └── index.ts       # Barrel exports for clean imports
├── contexts/          # React contexts for global state
├── screens/           # Page-level components
├── services/          # API clients and HTTP services
├── utils/            # Utility functions and helpers
└── main.tsx          # Application entry point
```

### Detailed Component Structure

```
src/components/
├── layout/
│   ├── Container.tsx      # Responsive container wrapper
│   ├── Grid.tsx          # Layout grid system
│   ├── Navbar.tsx        # Navigation component
│   ├── Section.tsx       # Page section wrapper
│   └── PrivateArea.tsx   # Authenticated layout wrapper
├── ui/
│   ├── Button.tsx        # Custom button component
│   ├── Card.tsx          # Card container component
│   ├── Text.tsx          # Typography component
│   ├── Heading.tsx       # Heading component
│   ├── DarkModeToggle.tsx # Theme switching
│   ├── DatePicker.tsx    # Date selection component
│   ├── AlertCard.tsx     # Alert/notification component
│   ├── SemiCircularGauge.tsx # Data visualization
│   └── HexTileChart.tsx  # Custom chart component
├── routing/
│   ├── PrivateRoute.tsx  # Authentication protection
│   ├── PublicRoute.tsx   # Public route wrapper
│   └── AdminRoute.tsx    # Admin role protection
├── forms/
│   ├── UserForm.tsx      # User creation/editing
│   └── GroupForm.tsx     # Group management
├── modals/
│   ├── ChangePasswordModal.tsx
│   └── UserGroupsModal.tsx
└── index.ts             # Barrel exports
```

### Services Directory Structure

```
src/services/
├── api.ts                    # Auto-generated API client (DO NOT MODIFY)
├── base.ts                   # API configuration
├── common.ts                 # Common API utilities
├── configuration.ts          # Auto-generated config API
├── index.ts                  # Service exports
├── authenticationService.ts  # Custom auth wrapper
├── userService.ts           # Custom user management
├── userManagementService.ts # Core user operations
├── groupService.ts          # Custom group management
├── groupManagementService.ts# Core group operations
├── gatesService.ts          # Gates functionality
├── alertsService.ts         # Alert management
├── storageService.ts        # Local storage utilities
└── docs/                    # Auto-generated API documentation
```

## Architecture Principles

### 1. Component Abstraction Strategy

**Core Principle**: All UI components live in `src/components/` as the single source of truth. Screens should never directly use UI library primitives.

**Benefits**:
- Easy UI library migration (e.g., from Chakra UI to another library)
- Consistent design system across the application
- Centralized component modifications
- Better testing and documentation

**Example**:
```tsx
// ❌ Bad: Using Chakra UI directly in screens
function UserScreen() {
  return (
    <Box p={4}>
      <Heading size="lg">Users</Heading>
      <Button colorScheme="blue">Add User</Button>
    </Box>
  )
}

// ✅ Good: Using abstracted components
import { Container, Heading, Button } from '../components'

function UserScreen() {
  return (
    <Container>
      <Heading level={1}>Users</Heading>
      <Button variant="primary">Add User</Button>
    </Container>
  )
}
```

### 2. API Service Pattern

**Core Principle**: Never modify auto-generated API files. Create custom service wrappers for extended functionality.

**Auto-Generated Files** (DO NOT MODIFY):
- `src/services/api.ts`
- `src/services/configuration.ts`
- `src/services/common.ts`
- `src/services/docs/`

**Custom Service Pattern**:
```tsx
// src/services/userService.ts
import { api } from './api'
import { withTokenValidation } from '../utils/apiErrorHandler'

export const userService = {
  // Wrapper around auto-generated API
  async getUsers(page: number = 1, limit: number = 10) {
    return withTokenValidation(async () => {
      return await api.usersControllerFindAll(page, limit)
    })
  },

  // Custom functionality not in generated API
  async getUserWithGroups(userId: string) {
    return withTokenValidation(async () => {
      const [user, groups] = await Promise.all([
        api.usersControllerFindOne(userId),
        api.groupsControllerFindUserGroups(userId)
      ])
      return { ...user, groups }
    })
  }
}
```

### 3. Route Protection Architecture

**Three-Tier Route Protection**:

1. **PublicRoute** - For login/register pages
2. **PrivateRoute** - Requires authentication
3. **AdminRoute** - Requires admin role

```tsx
// Route protection in App.tsx
<Route 
  path="/users" 
  element={
    <AdminRoute>
      <PrivateArea>
        <UsersScreen />
      </PrivateArea>
    </AdminRoute>
  } 
/>
```

### 4. Automatic Token Management

**Features**:
- Automatic token refresh every hour
- Global 401/403 handling with automatic logout
- Seamless retry of failed requests after token refresh

**Implementation**:
```tsx
// Global axios interceptors handle token validation automatically
// No manual implementation needed in components
```

## Component Organization

### Barrel Export Pattern

**File**: `src/components/index.ts`
```tsx
// Layout Components
export { Grid } from './layout/Grid'
export { Navbar } from './layout/Navbar'
export { Container } from './layout/Container'
export { Section } from './layout/Section'

// UI Components
export { Card } from './ui/Card'
export { Button } from './ui/Button'
export { Heading } from './ui/Heading'
export { Text } from './ui/Text'
export { DarkModeToggle } from './ui/DarkModeToggle'

// Routing Components
export { default as PrivateRoute } from './routing/PrivateRoute'
export { default as PublicRoute } from './routing/PublicRoute'
export { default as AdminRoute } from './routing/AdminRoute'

// Form Components
export { default as UserForm } from './forms/UserForm'
export { default as GroupForm } from './forms/GroupForm'
```

### Component Architecture Examples

#### Layout Component Pattern
```tsx
// src/components/layout/Container.tsx
import { Box, BoxProps } from '@chakra-ui/react'

interface ContainerProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Container({ size = 'lg', children, ...props }: ContainerProps) {
  const maxWidth = {
    sm: '480px',
    md: '768px', 
    lg: '1024px',
    xl: '1200px'
  }

  return (
    <Box 
      maxW={maxWidth[size]}
      mx="auto"
      px={{ base: 4, md: 6, lg: 8 }}
      {...props}
    >
      {children}
    </Box>
  )
}
```

#### UI Component Pattern
```tsx
// src/components/ui/Button.tsx
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'

interface ButtonProps extends Omit<ChakraButtonProps, 'colorScheme' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, ...props }: ButtonProps) {
  const variantMap = {
    primary: { colorScheme: 'blue', variant: 'solid' },
    secondary: { colorScheme: 'gray', variant: 'outline' },
    ghost: { colorScheme: 'gray', variant: 'ghost' },
    danger: { colorScheme: 'red', variant: 'solid' }
  }

  return (
    <ChakraButton
      isLoading={loading}
      {...variantMap[variant]}
      {...props}
    >
      {children}
    </ChakraButton>
  )
}
```

#### Route Protection Pattern
```tsx
// src/components/routing/AdminRoute.tsx
import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user, loading } = useContext(AuthContext)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
```

## API Integration Patterns

### Service Layer Architecture

#### 1. Auto-Generated API Client
```tsx
// src/services/api.ts (AUTO-GENERATED - DO NOT MODIFY)
export const api = {
  usersControllerFindAll: (page?: number, limit?: number) => { /* implementation */ },
  usersControllerCreate: (createUserDto: CreateUserDto) => { /* implementation */ },
  // ... other generated methods
}
```

#### 2. Custom Service Wrapper
```tsx
// src/services/userManagementService.ts
import { api } from './api'
import { withTokenValidation } from '../utils/apiErrorHandler'

export interface PaginatedUsers {
  data: User[]
  total: number
  page: number
  limit: number
}

export const userManagementService = {
  async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
    return withTokenValidation(async () => {
      const response = await api.usersControllerFindAll(page, limit)
      return response.data
    })
  },

  async createUser(userData: CreateUserDto): Promise<User> {
    return withTokenValidation(async () => {
      const response = await api.usersControllerCreate(userData)
      return response.data
    })
  },

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    return withTokenValidation(async () => {
      const response = await api.usersControllerUpdate(id, userData)
      return response.data
    })
  },

  async deleteUser(id: string): Promise<void> {
    return withTokenValidation(async () => {
      await api.usersControllerRemove(id)
    })
  }
}
```

#### 3. Token Validation Utility
```tsx
// src/utils/apiErrorHandler.ts
import { AuthContext } from '../contexts/AuthContext'

export async function withTokenValidation<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall()
  } catch (error: any) {
    if (isTokenExpiredError(error)) {
      // Global interceptors handle this automatically
      // This function serves as additional protection
      const authContext = useContext(AuthContext)
      authContext.logout()
      throw new Error('Session expired. Please log in again.')
    }
    throw error
  }
}

function isTokenExpiredError(error: any): boolean {
  if (!error.response) return false
  
  const status = error.response.status
  const message = error.response.data?.message?.toLowerCase() || ''
  
  return (
    status === 401 || 
    status === 403 ||
    message.includes('token') ||
    message.includes('unauthorized') ||
    message.includes('expired')
  )
}
```

### Centralized Token Management

#### Automatic Token Refresh
```tsx
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<{access_token: string, refresh_token?: string} | null>(null)

  // Automatic token refresh every hour
  useEffect(() => {
    if (!tokens?.access_token) return

    const interval = setInterval(async () => {
      try {
        await refreshAccessToken()
      } catch (error) {
        console.error('Failed to refresh token:', error)
        logout()
      }
    }, 3600000) // 1 hour

    return () => clearInterval(interval)
  }, [tokens?.access_token])

  // Global axios interceptors for automatic token handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      if (tokens?.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`
      }
      return config
    })

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          try {
            await refreshAccessToken()
            // Retry the original request
            return axios.request(error.config)
          } catch (refreshError) {
            logout()
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [tokens])
}
```

## Authentication & Authorization

### AuthContext Implementation

```tsx
// src/contexts/AuthContext.tsx
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<{access_token: string, refresh_token?: string} | null>(null)

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authenticationService.login(credentials)
      const { access_token, refresh_token, user: userData } = response.data
      
      setTokens({ access_token, refresh_token })
      setUser(userData)
      
      // Store in localStorage for persistence
      localStorage.setItem('access_token', access_token)
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token)
      }
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.')
    }
  }

  const logout = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  const refreshAccessToken = async () => {
    if (!tokens?.refresh_token) throw new Error('No refresh token available')
    
    try {
      const response = await authenticationService.refreshToken(tokens.refresh_token)
      const { access_token } = response.data
      
      setTokens(prev => prev ? { ...prev, access_token } : null)
      localStorage.setItem('access_token', access_token)
    } catch (error) {
      logout()
      throw error
    }
  }

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('access_token')
      const storedRefreshToken = localStorage.getItem('refresh_token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setTokens({ 
          access_token: storedToken, 
          refresh_token: storedRefreshToken || undefined 
        })
        setUser(JSON.parse(storedUser))
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      loading,
      login,
      logout,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Role-Based Access Control

```tsx
// Role-based menu rendering
export function Navbar() {
  const { user } = useContext(AuthContext)
  
  const adminMenuItems = [
    { path: '/users', label: 'Users', icon: FiUsers },
    { path: '/groups', label: 'Groups', icon: FiUsers },
    { path: '/gates', label: 'Gates', icon: FiShield },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ]

  const userMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/services', label: 'Services', icon: FiServer },
    { path: '/alerts', label: 'Alerts', icon: FiBell }
  ]

  const menuItems = user?.role === 'admin' 
    ? [...userMenuItems, ...adminMenuItems]
    : userMenuItems

  return (
    <VStack spacing={1}>
      {menuItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          <HStack spacing={3}>
            <Icon as={item.icon} />
            <Text>{item.label}</Text>
          </HStack>
        </NavLink>
      ))}
    </VStack>
  )
}
```

## Routing Architecture

### Comprehensive Route Setup

```tsx
// src/App.tsx - Complete routing example
function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute redirectIfAuthenticated={true}>
                  <LoginScreen />
                </PublicRoute>
              } 
            />

            {/* Private Routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <PrivateArea>
                    <DashboardScreen />
                  </PrivateArea>
                </PrivateRoute>
              } 
            />

            {/* Admin-Only Routes */}
            <Route 
              path="/users" 
              element={
                <AdminRoute>
                  <PrivateArea>
                    <UsersScreen />
                  </PrivateArea>
                </AdminRoute>
              } 
            />
            <Route 
              path="/users/new" 
              element={
                <AdminRoute>
                  <PrivateArea>
                    <UserFormScreen />
                  </PrivateArea>
                </AdminRoute>
              } 
            />
            <Route 
              path="/users/:id/edit" 
              element={
                <AdminRoute>
                  <PrivateArea>
                    <UserFormScreen />
                  </PrivateArea>
                </AdminRoute>
              } 
            />

            {/* Nested Resource Routes */}
            <Route 
              path="/groups/:id/users" 
              element={
                <AdminRoute>
                  <PrivateArea>
                    <GroupUsersScreen />
                  </PrivateArea>
                </AdminRoute>
              } 
            />
            <Route 
              path="/groups/:id/gates" 
              element={
                <AdminRoute>
                  <PrivateArea>
                    <GroupGatesScreen />
                  </PrivateArea>
                </AdminRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}
```

### Nested Route Patterns

**URL Structure Examples**:
- `/users` - List all users
- `/users/new` - Create new user
- `/users/:id/edit` - Edit specific user
- `/groups/:id/users` - View users in a group
- `/groups/:id/gates` - View gates for a group
- `/gates/:gateId/apis` - View APIs for a gate

## State Management

### Context-Based State Management

```tsx
// src/contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (storedTheme) setTheme(storedTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### Local State Management Patterns

```tsx
// Custom hook for form management
export function useFormState<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (validationRules: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    
    Object.entries(validationRules).forEach(([field, validator]) => {
      const error = validator(formData[field as keyof T])
      if (error) newErrors[field as keyof T] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    handleInputChange,
    validateForm
  }
}
```

## UI Design Patterns

### Standard CRUD List Layout

```tsx
// Standard pattern for all list screens
export function EntitiesScreen() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Entities</Heading>
          <Text color="gray.600">Manage your entities ({pagination.total} total)</Text>
        </VStack>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue"
          onClick={() => navigate('/entities/new')}
        >
          Create Entity
        </Button>
      </Flex>
      
      {/* Table */}
      <Box 
        bg={cardBg} 
        borderWidth="1px" 
        borderColor={borderColor} 
        rounded="lg" 
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th width="120px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {entities.map(entity => (
              <Tr key={entity.id}>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">{entity.name}</Text>
                    <Text fontSize="sm" color="gray.500">{entity.description}</Text>
                  </VStack>
                </Td>
                <Td>
                  <Badge colorScheme={entity.status === 'active' ? 'green' : 'red'}>
                    {entity.status}
                  </Badge>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {new Date(entity.createdAt).toLocaleDateString()}
                  </Text>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<FiEdit />} onClick={() => navigate(`/entities/${entity.id}/edit`)}>
                        Edit
                      </MenuItem>
                      <MenuItem icon={<FiEye />} onClick={() => navigate(`/entities/${entity.id}`)}>
                        View Details
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem icon={<FiTrash />} color="red.500" onClick={() => handleDelete(entity.id)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        
        {/* Integrated Pagination */}
        <VStack spacing={3} p={4} borderTopWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" w="full">
            <Text fontSize="sm" color="gray.600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} items
            </Text>
            <HStack spacing={2}>
              <Text fontSize="sm">Items per page:</Text>
              <Select size="sm" width="80px" value={pagination.limit} onChange={handleLimitChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Select>
            </HStack>
          </HStack>
          
          <HStack spacing={2}>
            <IconButton
              aria-label="First page"
              icon={<FiChevronsLeft />}
              size="sm"
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
              isDisabled={pagination.page === 1}
            />
            <IconButton
              aria-label="Previous page"
              icon={<FiChevronLeft />}
              size="sm"
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              isDisabled={pagination.page === 1}
            />
            
            {/* Page Numbers */}
            <HStack spacing={1}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = getPageNumber(i, pagination.page, totalPages)
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === pagination.page ? "solid" : "outline"}
                    colorScheme={pageNum === pagination.page ? "blue" : "gray"}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </HStack>
            
            <IconButton
              aria-label="Next page"
              icon={<FiChevronRight />}
              size="sm"
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              isDisabled={pagination.page === totalPages}
            />
            <IconButton
              aria-label="Last page"
              icon={<FiChevronsRight />}
              size="sm"
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
              isDisabled={pagination.page === totalPages}
            />
          </HStack>
        </VStack>
      </Box>
    </VStack>
  )
}
```

### Standard Form Layout

```tsx
// Standard pattern for create/edit forms
export function EntityFormScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const isCreateMode = !id
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(!isCreateMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    formData,
    errors,
    handleInputChange,
    validateForm
  } = useFormState<EntityFormData>({
    name: '',
    description: '',
    status: 'active',
    settings: {
      timeout: 60,
      retries: 3,
      enabled: true
    }
  })

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = validateForm({
      name: (value) => !value?.trim() ? 'Name is required' : undefined,
      description: (value) => !value?.trim() ? 'Description is required' : undefined
    })

    if (!isValid) return

    setSaving(true)
    setError('')

    try {
      if (isCreateMode) {
        await entityService.createEntity(formData)
        toast({
          title: 'Entity Created',
          description: 'The entity has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        await entityService.updateEntity(id!, formData)
        toast({
          title: 'Entity Updated',
          description: 'The entity has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      }
      navigate('/entities')
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving the entity.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/entities')
  }

  return (
    <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
      {/* Header */}
      <VStack align="start" spacing={4}>
        {/* Back Button */}
        <HStack spacing={4} align="center">
          <IconButton
            aria-label="Go back"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={handleBack}
          />
        </HStack>

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/entities')}>
              <HStack spacing={1}>
                <Icon as={FiBox} />
                <Text>Entities</Text>
              </HStack>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text>{isCreateMode ? 'Create Entity' : `Edit ${entity?.name || 'Entity'}`}</Text>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Title */}
        <VStack align="start" spacing={2}>
          <Heading size="lg">
            {isCreateMode ? 'Create New Entity' : 'Edit Entity'}
          </Heading>
          <Text color="gray.600">
            {isCreateMode 
              ? 'Fill in the details below to create a new entity.'
              : 'Update the entity information below.'
            }
          </Text>
        </VStack>
      </VStack>

      {/* Error Alert */}
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} rounded="lg" p={6}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Basic Information Section */}
            <VStack spacing={4} align="stretch">
              <Heading size="md">Basic Information</Heading>
              
              <FormControl isInvalid={Boolean(errors.name)} isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter entity name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(errors.description)} isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter entity description"
                  rows={3}
                />
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
            </VStack>

            {/* Settings Section */}
            <VStack spacing={4} align="stretch">
              <Heading size="md">Settings</Heading>

              <FormControl>
                <FormLabel>Timeout (seconds)</FormLabel>
                <NumberInput
                  min={1}
                  max={300}
                  value={formData.settings.timeout}
                  onChange={(_, valueNumber) => 
                    handleInputChange('settings', {
                      ...formData.settings,
                      timeout: isNaN(valueNumber) ? 60 : valueNumber
                    })
                  }
                >
                  <NumberInputField placeholder="60" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Maximum time to wait for a response
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Retry Attempts</FormLabel>
                <NumberInput
                  min={0}
                  max={10}
                  value={formData.settings.retries}
                  onChange={(_, valueNumber) => 
                    handleInputChange('settings', {
                      ...formData.settings,
                      retries: isNaN(valueNumber) ? 3 : valueNumber
                    })
                  }
                >
                  <NumberInputField placeholder="3" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Number of retry attempts on failure
                </Text>
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={formData.settings.enabled}
                  onChange={(e) => 
                    handleInputChange('settings', {
                      ...formData.settings,
                      enabled: e.target.checked
                    })
                  }
                >
                  Enable Entity
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Whether this entity is currently active and processing
                </Text>
              </FormControl>
            </VStack>

            {/* Actions */}
            <HStack spacing={4} justify="flex-end" pt={4}>
              <Button variant="ghost" onClick={handleBack}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                leftIcon={<FiSave />}
                isLoading={saving}
                loadingText={isCreateMode ? 'Creating...' : 'Updating...'}
              >
                {isCreateMode ? 'Create' : 'Update'} Entity
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </VStack>
  )
}
```

## Development Workflow

### Project Setup Commands

```bash
# Initialize new project
npm create vite@latest project-name -- --template react-ts
cd project-name

# Install core dependencies
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm install react-router-dom axios react-icons
npm install @types/react @types/react-dom typescript

# Install additional utilities
npm install react-datepicker @types/react-datepicker
npm install recharts @types/recharts
npm install firebase

# Development commands
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### File Creation Workflow

1. **Create Component Structure**:
```bash
mkdir -p src/components/{layout,ui,routing,forms,modals}
mkdir -p src/{contexts,screens,services,utils}
```

2. **Set up Barrel Exports**:
```bash
touch src/components/index.ts
touch src/services/index.ts
```

3. **Create Core Files**:
```bash
# Layout components
touch src/components/layout/{Container,Grid,Navbar,Section,PrivateArea}.tsx

# UI components  
touch src/components/ui/{Button,Card,Text,Heading,DarkModeToggle}.tsx

# Routing components
touch src/components/routing/{PrivateRoute,PublicRoute,AdminRoute}.tsx

# Core screens
touch src/screens/{LoginScreen,DashboardScreen}.tsx

# Services
touch src/services/{authenticationService,userService}.ts

# Contexts
touch src/contexts/AuthContext.tsx

# Utilities
touch src/utils/apiErrorHandler.ts
```

### Development Best Practices

1. **Component Development**:
   - Start with UI components in `src/components/ui/`
   - Build layout components for structure
   - Create screens using only component abstractions
   - Never import UI library components directly in screens

2. **API Integration**:
   - Use auto-generated API clients as base
   - Create custom service wrappers for extended functionality
   - Always use `withTokenValidation` wrapper
   - Handle errors consistently with toast notifications

3. **State Management**:
   - Use React Context for global state
   - Create custom hooks for complex state logic
   - Persist important state in localStorage
   - Handle loading and error states consistently

4. **Routing**:
   - Group related routes together
   - Use consistent route protection patterns
   - Implement breadcrumb navigation for nested routes
   - Handle route parameters with proper validation

5. **Testing Strategy**:
   - Test components in isolation
   - Mock API services for component tests
   - Test route protection logic
   - Verify form validation and submission

## Implementation Examples

### Complete User Management Feature

#### 1. User Service
```tsx
// src/services/userManagementService.ts
import { api } from './api'
import { withTokenValidation } from '../utils/apiErrorHandler'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  name: string
  password: string
  role: 'admin' | 'user'
}

export interface UpdateUserDto {
  email?: string
  name?: string
  role?: 'admin' | 'user'
  status?: 'active' | 'inactive'
}

export const userManagementService = {
  async getUsers(page: number = 1, limit: number = 10) {
    return withTokenValidation(async () => {
      const response = await api.usersControllerFindAll(page, limit)
      return response.data
    })
  },

  async getUserById(id: string) {
    return withTokenValidation(async () => {
      const response = await api.usersControllerFindOne(id)
      return response.data
    })
  },

  async createUser(userData: CreateUserDto) {
    return withTokenValidation(async () => {
      const response = await api.usersControllerCreate(userData)
      return response.data
    })
  },

  async updateUser(id: string, userData: UpdateUserDto) {
    return withTokenValidation(async () => {
      const response = await api.usersControllerUpdate(id, userData)
      return response.data
    })
  },

  async deleteUser(id: string) {
    return withTokenValidation(async () => {
      await api.usersControllerRemove(id)
    })
  },

  async changePassword(id: string, newPassword: string) {
    return withTokenValidation(async () => {
      const response = await api.usersControllerChangePassword(id, { password: newPassword })
      return response.data
    })
  }
}
```

#### 2. Users List Screen
```tsx
// src/screens/UsersScreen.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  VStack, HStack, Box, Table, Thead, Tbody, Tr, Th, Td,
  Heading, Text, Button, Badge, Menu, MenuButton, MenuList,
  MenuItem, MenuDivider, IconButton, useToast, useColorModeValue,
  Alert, AlertIcon, Spinner, Center
} from '@chakra-ui/react'
import { FiPlus, FiEdit, FiTrash, FiMoreVertical, FiUsers } from 'react-icons/fi'
import { userManagementService, User } from '../services/userManagementService'

export default function UsersScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await userManagementService.getUsers()
      setUsers(response.data || [])
    } catch (error: any) {
      setError(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return

    try {
      setDeletingId(id)
      await userManagementService.deleteUser(id)
      setUsers(prev => prev.filter(user => user.id !== id))
      
      toast({
        title: 'User Deleted',
        description: `User "${name}" has been deleted successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <Center h="200px">
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Loading users...</Text>
        </VStack>
      </Center>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Users</Heading>
          <Text color="gray.600">Manage system users ({users.length} total)</Text>
        </VStack>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue"
          onClick={() => navigate('/users/new')}
        >
          Create User
        </Button>
      </HStack>
      
      {/* Users Table */}
      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} rounded="lg" overflow="hidden">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th width="120px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map(user => (
              <Tr key={user.id}>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">{user.name}</Text>
                    <Text fontSize="sm" color="gray.500">{user.email}</Text>
                  </VStack>
                </Td>
                <Td>
                  <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                    {user.role}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={user.status === 'active' ? 'green' : 'red'}>
                    {user.status}
                  </Badge>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton 
                      as={IconButton} 
                      icon={<FiMoreVertical />} 
                      variant="ghost" 
                      size="sm" 
                      isLoading={deletingId === user.id}
                    />
                    <MenuList>
                      <MenuItem 
                        icon={<FiEdit />} 
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                      >
                        Edit User
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem 
                        icon={<FiTrash />} 
                        color="red.500"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        Delete User
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {users.length === 0 && (
          <VStack spacing={4} py={8}>
            <FiUsers size={48} color="gray" />
            <VStack spacing={2}>
              <Heading size="md" color="gray.500">No users found</Heading>
              <Text color="gray.500" textAlign="center">
                Get started by creating your first user
              </Text>
              <Button 
                leftIcon={<FiPlus />} 
                colorScheme="blue" 
                size="sm"
                onClick={() => navigate('/users/new')}
              >
                Create User
              </Button>
            </VStack>
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
```

### Complete Authentication Flow

```tsx
// src/screens/LoginScreen.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, VStack, Heading, Text, FormControl, FormLabel,
  Input, Button, Alert, AlertIcon, useColorModeValue
} from '@chakra-ui/react'
import { useAuth } from '../hooks/useAuth'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cardBg = useColorModeValue('white', 'gray.800')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(credentials)
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      minH="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <Box
        bg={cardBg}
        p={8}
        rounded="lg"
        shadow="lg"
        w="full"
        maxW="400px"
      >
        <VStack spacing={6}>
          <VStack spacing={2}>
            <Heading size="lg">Welcome Back</Heading>
            <Text color="gray.600">Sign in to your account</Text>
          </VStack>

          {error && (
            <Alert status="error" rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                w="full"
                isLoading={loading}
                loadingText="Signing In..."
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  )
}
```

## Conclusion

This architecture provides a solid foundation for building modern, scalable React applications. Key benefits include:

- **Maintainability**: Clear separation of concerns and consistent patterns
- **Scalability**: Modular structure that grows with your application
- **Developer Experience**: Type safety, hot reloading, and excellent tooling
- **User Experience**: Responsive design, loading states, and proper error handling
- **Security**: Robust authentication with automatic token management

The patterns and examples in this guide can be adapted to fit your specific requirements while maintaining the core architectural principles that make this structure so effective.