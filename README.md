# QAX Client

QAX is a QA test management platform.

This `client` app is the frontend half of the project. It connects to the Express API in `../server` and provides the main workspace for sign-in, dashboard analytics, project management, test-case tables, bug tracking, templates, admin tools, and exports.

## What It Does

- Auth flow with login, logout, session restore, and forced password change.
- Dashboard with project, row, bug, and execution stats.
- Project library with create, duplicate, delete, and template-based setup.
- Project workspace with dynamic test-case tables, custom columns, row editing, filtering, bulk delete, and row duplication.
- Bug tracker with severity, priority, status, and attachment support.
- Template library for reusable column sets.
- Admin area for user management and audit log review.
- XLSX and PDF export for each project.

## Tech Stack

- TanStack Start
- React 19
- TanStack Router
- TanStack Query
- TypeScript
- Tailwind CSS 4
- Radix UI / shadcn-style primitives
- Sonner for toast alerts

## Project Layout

- `src/routes/` - file-based routes for login, dashboard, projects, templates, profile, and admin pages.
- `src/lib/` - API client, auth state, theme, error handling, and shared utilities.
- `src/components/` - shared UI and layout pieces.
- `src/components/ui/` - reusable UI primitives.
- `public/` - static assets like the QAX favicon.

## Backend Overview

The frontend talks to the backend in `../server`, which provides:

- JWT auth and password changes.
- User management for admins.
- Projects, columns, rows, and bugs.
- Template CRUD and built-in starter templates.
- Attachment upload signing and Cloudinary registration.
- Audit log and dashboard stats.
- XLSX and PDF exports.

## Local Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app expects the API URL in `VITE_API_URL`.

Example local value:

```env
VITE_API_URL=http://localhost:4000
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run build:dev` - dev-mode build
- `npm run preview` - preview built app
- `npm run lint` - run ESLint
- `npm run format` - run Prettier

## Notes

- The client stores the auth token and cached user in `localStorage`.
- Non-auth requests send `Authorization: Bearer <token>`.
- CORS must allow the client origin from the backend `CORS_ORIGINS` config.
