# Project Management SaaS — Backend

A multi-tenant **Project Management SaaS** REST API built with Node.js, Express, TypeScript, PostgreSQL (Prisma), Redis, and Stripe. Organizations sign up, invite team members, organize work into Teams → Projects → Sprints → Tasks, and pay for premium plans through real Stripe subscription billing.

---

## Live Links

| | |
|---|---|
| **Live API** | `https://projectmanagementsaas-backend-kut7hbaxz-ironbat106s-projects.vercel.app` |
| **API Documentation (Postman)** | `https://github.com/ironbat106/project-management-saas-backend/blob/main/PM-SaaS.postman_collection.json` |
| **Backend Repository** | `https://github.com/ironbat106/project-management-saas-backend` |
| **Admin Email** | `admin@pmsaas.com` |
| **Admin Password** | `ChangeThisPassword123!` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / Language | Node.js, TypeScript (ESM) |
| Framework | Express |
| Database | PostgreSQL |
| ORM | Prisma (multi-file schema) |
| Validation | Zod |
| Auth | JWT (access + refresh), Bearer tokens, bcrypt, Google OAuth (GCP Social Login) |
| Caching / Sessions | Redis (dashboard-stat caching + refresh-token blacklist for logout) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Security | Helmet, CORS, express-rate-limit |
| Build / Deploy | tsup, Vercel (serverless) |

---

## Roles

The system has exactly **3 fixed roles** with strict role-based authorization:

| Role | Description |
|---|---|
| `ADMIN` | Platform administrator. Exactly one, created via the seed script. Manages users, organizations, and platform-wide statistics/audit logs across the entire SaaS. |
| `OWNER` | Created automatically on sign-up. Owns one or more Organizations, manages members/teams/projects, and controls billing. |
| `MEMBER` | Created only when an `OWNER` invites someone into their Organization. Works on assigned tasks. |

---

## Core Entities

```
Organization
 ├─ OrganizationMember (users who belong to it)
 ├─ Team
 │   └─ TeamMember
 ├─ Project
 │   ├─ Sprint
 │   └─ Task
 │       ├─ Subtask
 │       └─ Comment
 ├─ Payment (Stripe subscription history)
 └─ ActivityLog (audit trail)
```

An `OWNER` creates an `Organization`, invites `MEMBER`s, optionally groups them into `Team`s, creates `Project`s, breaks work into `Sprint`s, and creates `Task`s that members complete. Every important action is written to the `ActivityLog`.

---

## Features

- **Auth**: register, login, refresh token, logout (Redis-backed refresh-token blacklist), Google social login
- **User Profile**: view/update profile, change password
- **Organizations**: full CRUD, role-scoped listing, Redis-cached dashboard statistics
- **Members**: invite (existing or brand-new account), list, remove
- **Teams**: create, list, add/remove members
- **Projects**: full CRUD with a forward-only status workflow (`ACTIVE → COMPLETED → ARCHIVED`)
- **Sprints**: create, list, transaction-safe status workflow (only one `ACTIVE` sprint per project at a time)
- **Tasks**: full CRUD, pagination/filtering/search, a flexible status workflow (`TODO ↔ IN_PROGRESS ↔ IN_REVIEW → DONE`, with reopen support), assignment, personal "my tasks" view
- **Subtasks & Comments**: lightweight checklist items and discussion threads on tasks
- **Payments**: real Stripe Checkout subscription billing (FREE / PRO / BUSINESS plans) with webhook-confirmed payments and full history
- **Admin**: user management (block/unblock), organization oversight, platform-wide statistics, audit log viewer

Every list endpoint supports pagination (`page`, `limit`), sorting (`sortBy`, `sortOrder`), and — where relevant — filtering and text search (`searchTerm`).

---

## Project Structure

```
prisma/
  schema/                  # multi-file Prisma schema (one model per file)
src/
  app.ts                   # Express app: security middleware, routes, error handling
  server.ts                # entry point: connects DB + Redis, starts the server
  app/
    config/                # environment variable loader
    interfaces/            # shared types (pagination, etc.)
    lib/                   # prisma, redis, stripe, google-auth clients
    middleware/             # auth (RBAC), validation, rate limiting, error handling
    module/
      auth/
      user/
      organization/
      team/
      project/
      sprint/
      task/
      payment/
      admin/
    utils/                  # AppError, catchAsync, sendResponse, activityLog, orgAccess, jwt, seed
    routes/                 # central router
postman/
  PM-SaaS.postman_collection.json
```

Each module follows the same pattern: `*.interface.ts` → `*.validation.ts` (Zod) → `*.service.ts` (business logic) → `*.controller.ts` → `*.route.ts`.

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database ([Neon](https://neon.tech) or [Supabase](https://supabase.com) both offer free tiers)
- A Redis database ([Redis Cloud](https://redis.io/try-free) or [Upstash](https://upstash.com))
- A [Stripe](https://stripe.com) account (test mode) with two recurring Prices created (PRO, BUSINESS)
- A Google Cloud OAuth 2.0 Client ID (for social login)

### 2. Install

```bash
git clone <this-repo-url>
cd project-management-saas-backend
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in every value:

```bash
cp .env.example .env
```

### 4. Set up the database

```bash
npx prisma generate --schema=prisma/schema
npx prisma migrate dev --schema=prisma/schema --name init
```

### 5. Seed the platform admin account

```bash
npm run seed
```

### 6. Run the server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`, with every route under `/api/v1`.

### 7. Test with Postman

Import `postman/PM-SaaS.postman_collection.json` and set the `baseUrl` collection variable to `http://localhost:5000/api/v1`.

For Stripe webhook testing locally, run the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

---

## Build & Deploy

```bash
npm run build       # bundles with tsup into dist/
node dist/server.js # sanity-check the built output locally
vercel --prod        # deploy (see vercel.json)
```

Remember to also set every environment variable on Vercel, and to update your Stripe webhook endpoint and Google OAuth authorized origins to your production URL after your first deploy.

---

## API Overview

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`.

| Module | Base path | Examples |
|---|---|---|
| Auth | `/auth` | `POST /register`, `POST /login`, `POST /refresh-token`, `POST /logout`, `POST /google` |
| User | `/users` | `GET /me`, `PATCH /me`, `PATCH /me/change-password` |
| Organizations | `/organizations` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /:id/dashboard-stats`, `POST /:id/members`, `GET /:id/members`, `DELETE /:id/members/:memberId` |
| Teams | `/organizations/:organizationId/teams`, `/teams/:teamId/members` | create, list, add/remove member |
| Projects | `/organizations/:organizationId/projects`, `/projects/:id` | create, list, get, update, `PATCH /:id/status`, delete |
| Sprints | `/projects/:projectId/sprints`, `/sprints/:id` | create, list, `PATCH /:id/status` |
| Tasks | `/projects/:projectId/tasks`, `/tasks/:id` | create, list, `GET /my-tasks`, get, update, `PATCH /:id/status`, `POST /:id/assign`, delete, subtasks, comments |
| Payments | `/payments` | `POST /checkout`, `POST /webhook`, `GET /organizations/:organizationId` |
| Admin | `/admin` | `GET /users`, `PATCH /users/:id/status`, `GET /organizations`, `GET /audit-logs`, `GET /dashboard-stats` |

See the Postman collection for the full list of 45+ endpoints with example request bodies.

---

## Design Notes

- **Soft deletes**: Organizations, Projects, Tasks, Subtasks, Comments, and Organization Members are marked `isDeleted` rather than physically removed.
- **Transactions**: used wherever multiple writes must succeed together or a race condition must be prevented — e.g. creating an organization also enrolls its owner as a member; deleting an organization cascades a soft-delete to its projects and tasks; activating a sprint checks "is there already an active sprint?" atomically.
- **Consistent responses**: every endpoint replies with `{ success, message, data }` (plus `meta` for paginated lists) on success, and `{ success: false, message, errors }` on failure.
- **Redis is used twice, for two different reasons**: as a refresh-token blacklist (real logout for stateless JWTs) and as a short-lived cache for dashboard statistics.

