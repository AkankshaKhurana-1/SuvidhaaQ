# 🏛️ System Architecture

The Hospital Queue Elimination System is designed around a scalable, real-time, micro-modular architecture capable of handling multi-tenant hospital operations, dynamic patient triaging, and real-time live synchronization.

---

## 🏗️ High-Level Component Architecture

```
[ Patient / Staff Clients ]
            │
            ▼
┌───────────────────────────────┐
│     Express.js API Layer      │
│  - Helmet & CORS Security     │
│  - Hospital Multi-Tenant MW   │
│  - JWT & RBAC Auth Middleware │
│  - Zod Request Validators     │
└──────────────┬────────────────┘
               │
       ┌───────┴───────────────┐
       ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Queue Engine  │       │ Socket.IO Hub │
│ - Priority    │       │ - Live Rooms  │
│ - Wait Time   │       │ - Push Alerts │
│ - Reorder     │       └───────────────┘
└───────┬───────┘
        ▼
┌───────────────────────────────┐
│     Prisma ORM Client         │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│    PostgreSQL Database        │
│    (15 Relational Tables)     │
└───────────────────────────────┘
```

---

## 🔐 Multi-Tenancy & Security
- **Hospital Isolation**: Handled via `x-hospital-id` header in `hospital.middleware.ts`.
- **Authentication**: Stateless JSON Web Tokens (JWT) signed with `JWT_SECRET`.
- **Role-Based Access Control (RBAC)**: Role validation (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `LAB`) executed via `role.middleware.ts`.

---

## ⚡ Real-Time Engine (Socket.IO)
- Clients subscribe to doctor-specific rooms (`queue_doctor_<doctor_id>`).
- On status changes, patient check-ins, or next patient calls, events are pushed:
  - `queue_updated`: Queue position and ETA recalculation
  - `patient_called`: Alert to current patient
  - `doctor_status_changed`: Doctor availability changes
  - `emergency_alert`: Immediate alert for critical cases
