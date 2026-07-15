# OfficeFlow — Office Management SaaS

A production-ready, multi-tenant office management web application built with React, Vite, Firebase, and Tailwind CSS.

---

## Features

- **Authentication** — Email/password login & signup, persistent sessions
- **Multi-tenant** — Each company gets its own isolated workspace (tenantId)
- **Role-based access** — Admin, Manager, Employee with granular permissions
- **Dashboard** — Stats, charts (pie, bar, area, radial), real-time data
- **Employee Management** — CRUD, profile image upload, search & filters
- **Lead Management** — CRUD, Kanban + table views, pipeline tracking
- **Project Management** — CRUD, progress tracking, employee assignment
- **Task Management** — Kanban + list views, per-project sub-collections
- **Reports** — Advanced analytics with multiple chart types
- **Team Management** — Admin can manage user roles
- **Activity Logs** — Real-time audit trail with entity filters
- **Settings** — Profile edit, dark mode toggle, workspace info
- **Dark mode** — Persistent theme preference
- **Responsive** — Mobile + desktop layouts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Firebase (Auth + Firestore + Storage) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

The Firebase config is already set in `.env`. If you need to use a different project, update `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Create your first account

Go to `/signup` and create a company workspace. The first user is automatically an **Admin**.

### 5. Load sample data

After signing up, click **"Load sample data"** on the dashboard to populate demo employees, leads, and projects.

---

## Firestore Setup

### Deploy security rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project)
firebase use digital-cards-38a1d

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Firestore indexes

The `firestore.indexes.json` file contains all required composite indexes. Deploy them with:

```bash
firebase deploy --only firestore:indexes
```

---

## Deployment

### Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Add your `.env` variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Folder Structure

```
src/
├── components/
│   ├── layout/          # DashboardLayout, Header, Sidebar
│   ├── ui/              # Reusable UI components
│   └── SeedDemoButton   # Demo data loader
├── hooks/               # Custom React hooks
├── lib/                 # Firebase, utils, constants, permissions
├── pages/               # Page components
│   └── auth/            # Login, Signup
├── routes/              # ProtectedRoute, GuestRoute
├── schemas/             # Zod validation schemas
├── services/            # Firebase service layer
├── stores/              # Zustand state stores
└── types/               # TypeScript interfaces
```

---

## Role Permissions

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| Dashboard | ✅ Full | ✅ Full | ✅ Basic |
| Employees (read) | ✅ | ✅ | ❌ |
| Employees (write) | ✅ | ❌ | ❌ |
| Leads (read) | ✅ | ✅ | ✅ |
| Leads (write) | ✅ | ✅ | ❌ |
| Projects (read) | ✅ | ✅ | ✅ (assigned only) |
| Projects (write) | ✅ | ✅ | ❌ |
| Tasks (read) | ✅ | ✅ | ✅ |
| Tasks (write) | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| Team management | ✅ | ❌ | ❌ |
| Activity logs | ✅ | ✅ | ❌ |

---

## Firestore Data Model

```
users/{uid}
  - uid, name, email, role, tenantId, companyName, createdAt

tenants/{tenantId}
  - name, createdAt

employees/{id}
  - tenantId, name, email, phone, role, department, joiningDate, profileImage, createdAt

leads/{id}
  - tenantId, clientName, contact, source, status, assignedTo, notes, createdAt

projects/{id}
  - tenantId, name, description, status, progress, startDate, endDate, assignedEmployees[], createdAt
  └── tasks/{taskId}
        - title, assignedTo, status, dueDate, createdAt

activity_logs/{id}
  - tenantId, action, userId, userName, entityType, entityId, timestamp
```
