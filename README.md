# SuvidhaaQ — Digital Hospital OPD Queue & Appointment Management System

SuvidhaaQ is a multi-tenant digital hospital OPD queue and appointment management platform.

---

## 🚀 Running the Platform

### Start With One Command
```bash
npm run dev
```

- 🌐 **Web Portal (All Roles)**: `http://localhost:3000`
- 📡 **Backend API & Socket.IO**: `http://localhost:5001/api/v1`

---

## 🔑 Unified Login (All Roles at `http://localhost:3000/login`)

The login screen features **1-Click Demo Buttons** to instantly test each role:

| Role | 1-Click Button | Identifier | Password | Destination Dashboard |
|---|---|---|---|---|
| **Patient** | `[ 👤 Patient ]` | `9000000001` (Phone) | `Patient@123` | `/app/home` |
| **Receptionist** | `[ 🏥 Reception ]` | `reception@suvidhaaq.demo` | `Reception@123` | `/dashboard/receptionist` |
| **Doctor** | `[ 👨‍⚕️ Doctor ]` | `doctor@suvidhaaq.demo` | `Doctor@123` | `/dashboard/doctor` |
| **Admin** | `[ 👨‍💼 Admin ]` | `admin@suvidhaaq.demo` | `Admin@123` | `/dashboard/admin` |

---

## 🧪 Running Tests
```bash
npm run test
```

Runs all 25 Vitest tests (priority engine, permissions matrix, account lockout, and 50 concurrent bookings).
