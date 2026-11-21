# 🗄️ Database Schema Documentation

The system uses PostgreSQL managed via Prisma ORM (`backend/src/prisma/schema.prisma`).

---

## 📋 Entity Relationship Overview

| Model | Primary Key | Description |
| :--- | :--- | :--- |
| `hospitals` | `hospital_id` | Multi-branch hospital entities, registration, contact details |
| `departments` | `department_id` | Medical departments (e.g. Cardiology, General Medicine) |
| `users` | `user_id` | Core authentication and user profile table with roles |
| `doctors` | `doctor_id` | Doctor profile, specialization, rating, availability status |
| `admins` | `admin_id` | Hospital administrator profiles and permissions |
| `receptionists` | `receptionist_id` | Front-desk staff managing walk-ins and queues |
| `patients` | `patient_id` | Patient clinical identity, unique UHID, age, blood group |
| `appointments` | `appointment_id` | Pre-booked appointment slots, dates, types |
| `queue_tokens` | `token_id` | Dynamic daily queue tokens with priority score and ETA |
| `walk_in_patients` | `walkin_id` | Front-desk walk-in registrations |
| `consultations` | `consultation_id` | Doctor-patient consultation records, notes, duration |
| `follow_up_consultations` | `followup_id` | Follow-up tracking and revisit reasons |
| `lab_reports` | `report_id` | Diagnostic test reports and uploaded document URLs |
| `billing_invoices` | `invoice_id` | Payment status and consultation invoices |
| `notifications` | `notification_id` | User-targeted notifications, queue alerts |

---

## 🔑 Key Relationships
- `doctors` belong to `departments` and `hospitals`, linked 1:1 to `users`.
- `queue_tokens` link `patients` and `doctors`, optionally connecting to `appointments` or `walk_in_patients`.
- `consultations` link to a unique `queue_tokens` record and can produce multiple `lab_reports`.
