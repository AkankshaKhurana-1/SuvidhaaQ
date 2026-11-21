# 📡 Hospital Queue System - API Documentation

Base URL: `http://localhost:3001/api`

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header. Multi-tenant endpoints optionally accept `x-hospital-id: <HOSPITAL_ID>`.

---

## 🔐 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
- **Description**: Authenticate user and receive a JWT.
- **Body**:
  ```json
  {
    "email": "doctor@hospital.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "2",
        "full_name": "Dr. Sarah Mitchell",
        "email": "doctor@hospital.com",
        "role": "DOCTOR",
        "hospital_id": "1",
        "doctor_id": "1"
      }
    }
  }
  ```

### `POST /api/auth/register`
- **Description**: Register a new user in the system.
- **Body**:
  ```json
  {
    "hospital_id": "1",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword",
    "role": "PATIENT"
  }
  ```
- **Response**: `201 Created`

### `GET /api/auth/me` *(Protected)*
- **Description**: Returns details for the authenticated user session.

---

## 🚦 2. Queue Engine (`/api/queue`)

### `GET /api/queue/live/:doctor_id` *(Protected)*
- **Description**: Returns real-time queue position, currently serving patient, and waiting queue with dynamic ETAs.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "doctor_id": "1",
      "doctor_name": "Dr. Sarah Mitchell",
      "availability": "available",
      "currently_serving": {
        "token_id": "3",
        "token_code": "CARD-003",
        "patient_name": "Arthur Pendelton"
      },
      "queue_length": 2,
      "waiting_queue": [
        {
          "token_id": "2",
          "token_code": "CARD-002",
          "patient_name": "Emily Watson",
          "queue_position": 1,
          "priority_score": 60,
          "estimated_wait_time": 15
        }
      ]
    }
  }
  ```

### `POST /api/queue/generate` *(Protected)*
- **Description**: Issues a queue token for walk-in or appointment.
- **Body**:
  ```json
  {
    "patient_id": "2",
    "doctor_id": "1",
    "token_type": "Walk-in",
    "is_emergency": false
  }
  ```
- **Response**: `201 Created`

### `POST /api/queue/call-next` *(Protected: DOCTOR, RECEPTIONIST, ADMIN)*
- **Description**: Advances the queue, marks current serving patient as completed, and calls next in priority.
- **Body**:
  ```json
  { "doctor_id": "1" }
  ```

### `PUT /api/queue/status` *(Protected)*
- **Description**: Updates token status (`Waiting`, `Serving`, `Completed`, `Cancelled`, `No-Show`).

---

## 👥 3. Patient Management (`/api/patient`)

### `GET /api/patient/all` *(Protected)*
- **Description**: Returns all registered patients.

### `GET /api/patient/:patient_id` *(Protected)*
- **Description**: Returns full clinical profile, recent appointments, queue tokens, and lab reports.

### `GET /api/patient/uhid/:uhid` *(Protected)*
- **Description**: Searches a patient by their Unique Health ID (UHID).

### `POST /api/patient` *(Protected)*
- **Description**: Registers a new patient and generates their unique UHID.

---

## 📅 4. Appointments (`/api/appointment`)

### `POST /api/appointment/book` *(Protected)*
- **Body**:
  ```json
  {
    "patient_id": "1",
    "doctor_id": "1",
    "date": "2026-11-21",
    "time": "10:30",
    "type": "new",
    "notes": "Followup consultation"
  }
  ```

### `GET /api/appointment/all` *(Protected)*
- **Description**: Lists all appointments.

### `GET /api/appointment/:patient_id` *(Protected)*
- **Description**: Lists appointments for a specific patient.

---

## 👨‍💼 5. Admin Command Center & Analytics (`/api/admin`)

*(Protected: Role `ADMIN`)*

### `GET /api/admin/command-center`
- Real-time hospital metrics (`total_patients_today`, `currently_waiting`, `in_consultation`, `avg_wait_time`, `followup_ratio`, `doctor_status`).

### `GET /api/admin/analytics`
- Historical metrics (`peak_hours`, `avg_consultation_time`, `patients_per_hour`).

### `GET /api/admin/staff`
- Staff registry breakdown.

---

## 🔔 6. Notifications (`/api/notification`)

### `GET /api/notification/user/:user_id` *(Protected)*
- Lists notifications for a given user.

### `PUT /api/notification/read/:notification_id` *(Protected)*
- Marks a notification as read.

### `POST /api/notification/send` *(Protected)*
- Sends a notification to a user.
