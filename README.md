# Recipe Management App - Frontend

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

This app uses Firebase for authentication. Firebase projects are managed via Terraform.

**Using Terraform (Recommended for teams):**
1. See [terraform/README.md](./terraform/README.md) for complete setup
2. Deploy dev environment via Cloud Build:
   ```bash
   ./scripts/deploy-terraform.sh dev YOUR_BILLING_ACCOUNT YOUR_ORG_ID
   ```
3. Get Firebase config:
   ```bash
   cd terraform/environments/dev
   terraform output -raw env_file_content > ../../../.env
   ```

**Manual setup (Alternative):**
1. Create a Firebase project manually at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Copy `.env.example` to `.env` and add your Firebase config
4. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for details

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
