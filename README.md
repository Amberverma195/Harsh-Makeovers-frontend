# Harsh Makeovers Frontend

Frontend web app for Harsh Makeovers. Built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion, and React Icons.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- React Icons
- Zod

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

The frontend calls the backend through relative API routes under:

```text
/api/v1
```

For local development, run the backend API separately on the expected local port and use a proxy/rewrite or deployment routing setup if needed.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Main Areas

- Home
- Services
- Classes
- Portfolio
- Booking
- Contact
- Login and registration
- User profile
- My bookings
- Admin dashboard
- Admin bookings, slots, users, reviews, portfolio, inquiries, and security

## Project Structure

```text
src/app         Next.js app routes
src/components  Reusable UI components
src/context     React context providers
src/hooks       Custom React hooks
src/lib         API client, validators, and utilities
src/types       Shared TypeScript types
public          Static assets
```

## Notes

Do not commit `node_modules`, `.next`, logs, environment files, or local build output. The repository includes a `.gitignore` for those files.

