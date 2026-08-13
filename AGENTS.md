# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
- `npm start` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run webapp:dev` - Start webpack dev server
- `npm run webapp:build:prod` - Build optimized production bundle

### Backend Development
- `./mvnw` - Start Spring Boot backend server
- `./mvnw -Pprod clean verify` - Build production JAR
- `npm run backend:start` - Start backend without frontend build

### Testing
- `npm test` - Run Jest unit tests
- `npm run jest` - Run Jest with coverage
- `npm run backend:unit:test` - Run Java backend tests
- `./mvnw verify` - Run all tests (frontend and backend)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run prettier:check` - Check code formatting
- `npm run prettier:format` - Format code with Prettier

### Full Development Workflow
Run these commands in separate terminals for optimal development:
```
./mvnw
npm start
```

## Architecture Overview

This is a JHipster 7.9.3 full-stack application with:

### Backend Stack
- **Spring Boot** with Java
- **MongoDB** for data persistence
- **Redis** for caching (optional)
- **Elasticsearch** for search capabilities
- **Kafka** for messaging

### Frontend Stack
- **React 18.2** with TypeScript
- **Redux Toolkit** for state management
- **PrimeReact** as the primary UI component library
- **Axios** for HTTP requests
- **React Router** for navigation

### Key Frontend Architecture Patterns

#### Entity Structure
All business entities are located in `src/main/webapp/app/entities/` with consistent patterns:
- Each entity has its own folder with CRUD operations
- Redux reducers follow naming convention: `[entity].reducer.ts`
- Update/Create forms: `[entity]-update.tsx`
- Delete dialogs: `[entity]-delete-dialog.tsx`
- Main listing component: `[entity].tsx`

#### State Management
- Redux store configured in `src/main/webapp/app/config/store.ts`
- Entity reducers in individual entity folders
- Shared reducers in `src/main/webapp/app/shared/reducers/`
- Authentication state managed centrally

#### Component Organization
- **Shared components**: `src/main/webapp/app/shared/components/`
- **Layout components**: `src/main/webapp/app/shared/layout/`
- **Sidebar/Navigation**: `src/main/webapp/app/shared/sidebar/`
- **Utilities**: `src/main/webapp/app/shared/util/`

#### Specialized Modules
- **POS System**: Complex point-of-sale functionality in `entities/order/`
- **Pizza Configuration**: Specialized pizza settings in `entities/pizza-settings/`
- **Inventory Management**: Stock and warehouse management in `entities/inventory/`
- **Online Ordering**: Customer-facing ordering system in `entities/online-ordering/`

### Key Business Domains
1. **Restaurant/Retail Items** - Menu items, pizzas, retail products
2. **Order Management** - POS orders, online orders, billing
3. **Customer Management** - Customer profiles, loyalty cards
4. **Inventory** - Stock management, suppliers, warehouses
5. **Settings** - Business configuration, tax profiles, printers

### Infrastructure Files
- `webpack/` - Build configuration
- `src/main/docker/` - Docker compose files for development services
- `i18n/` - Internationalization files (English, Arabic, French)

### Development Notes
- Uses Maven wrapper (`./mvnw`) for Java builds
- npm wrapper (`./npmw`) available for Node.js
- JHipster entity generator creates consistent CRUD patterns
- Never stage, commit, or push `.env` files or environment/secret configuration files unless the user explicitly asks for that exact file to be published.
- All forms use React Hook Form for validation
- PrimeReact components are heavily customized with SCSS
