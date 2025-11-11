# Recipe Management App - Frontend

[![CI](https://github.com/theandiman/recipe-management-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/theandiman/recipe-management-frontend/actions/workflows/ci.yml)
[![PR Checks](https://github.com/theandiman/recipe-management-frontend/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/theandiman/recipe-management-frontend/actions/workflows/pr-checks.yml)

A modern recipe management application frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Firebase** - Authentication and hosting

## Project Structure

```
src/
├── components/     # Reusable UI components
├── features/       # Feature-specific modules
├── utils/          # Utility functions and helpers
├── types/          # TypeScript type definitions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Firebase Setup

This app uses Firebase for authentication. Firebase projects are managed by the **[recipe-management-infrastructure](https://github.com/theandiman/recipe-management-infrastructure)** repository.

**Quick Start:**

1. **Clone the infrastructure repository:**
   ```bash
   git clone git@github.com:theandiman/recipe-management-infrastructure.git
   ```

2. **Get Firebase configuration for development:**
   ```bash
   cd recipe-management-infrastructure/terraform/environments/dev
   terraform init
   terraform output -raw env_file_content > /path/to/recipe-management-frontend/.env
   ```

3. **Restart development server:**
   ```bash
   npm run dev
   ```

**For detailed setup:** See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for complete guide on getting Firebase configuration and working with the infrastructure repository.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in UI Mode

```bash
npm run test:ui
```

### Run E2E Tests (Playwright)

```bash
npx playwright test
```

### View Test Results

```bash
npx playwright show-report
```

## Continuous Integration

This project uses GitHub Actions for CI/CD:

- **Lint**: Runs ESLint on every push and PR
- **Type Check**: Validates TypeScript types
- **Unit Tests**: Runs all unit tests with coverage reporting
- **Build**: Ensures production build succeeds
- **E2E Tests**: Runs Playwright tests for UI validation
- **Security**: Checks for vulnerabilities and secrets

All checks must pass before merging PRs.

## Development Guidelines

- Follow the existing folder structure for consistency
- Use TypeScript for type safety
- Leverage Tailwind CSS utility classes for styling
- Create reusable components in the `components/` directory
- Organize feature-specific code in `features/` subdirectories

## Next Steps

This is a skeleton frontend ready for development. You can now:

1. Add feature modules in the `features/` directory
2. Create reusable components
3. Set up API integration utilities
4. Configure routing with React Router
5. Add state management (if needed)

## License

Private - Recipe Management App
