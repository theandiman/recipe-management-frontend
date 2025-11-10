# Recipe Management App - Frontend Setup

## Project Type
React TypeScript with Vite, Tailwind CSS v4, Firebase Auth

## Setup Complete! ✓

The recipe management frontend is ready for development with:
- React 18 + TypeScript
- Vite for fast development and building
- Tailwind CSS v4 with @tailwindcss/postcss
- React Router for routing
- Firebase Authentication (Email/Password)
- Organized folder structure (components/, features/, utils/, types/)

## Authentication
- Firebase Auth with email/password
- Protected routes with automatic redirect
- User session persistence
- Firebase projects managed by [recipe-management-infrastructure](https://github.com/theandiman/recipe-management-infrastructure) repo
- See INFRASTRUCTURE.md for how to get Firebase config

## Infrastructure
- All Firebase projects, GCP resources, and Terraform code managed in separate repository
- This frontend repo consumes Firebase config from infrastructure outputs
- No Terraform files in this repository
- See INFRASTRUCTURE.md for complete guide

## Development
Start development: `npm run dev`
Build for production: `npm run build`
Deploy to Firebase: `firebase deploy` (after configuring Firebase CLI with project from infrastructure repo)
