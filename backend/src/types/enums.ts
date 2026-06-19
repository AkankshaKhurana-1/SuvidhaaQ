export enum UserRole {
  PATIENT = 'patient',
  RECEPTION = 'receptionist',
  DOCTOR = 'doctor',
  LAB = 'lab',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Not Specified',
}

export enum PatientUrgency {
  NORMAL = 'normal',
  SENIOR = 'senior',
  CHILD = 'child',
  PREGNANT = 'pregnant',
  CRITICAL = 'critical',
}

export enum PatientType {
  NEW = 'new',
  FOLLOWUP = 'followup',
  WALKIN = 'walkin',
}

export enum AppointmentType {
  NEW = 'General',
  FOLLOWUP = 'Follow-up',
}

export enum AppointmentStatus {
  UPCOMING = 'Upcoming',
  WAITING = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'no_show',
}

export enum QueueStatus {
  WAITING = 'Waiting',
  CALLED = 'Called',
  ARRIVED = 'Arrived',
  IN_CONSULTATION = 'Serving',
  IN_TEST = 'in_test',
  REPORT_READY = 'report_ready',
  DONE = 'done',
  COMPLETED = 'Completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  EMERGENCY = 'emergency',
}

export enum DoctorStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'on_leave',
  BUSY = 'busy',
}

export enum ReportStatus {
  PENDING = 'Uploaded',
  REVIEWED = 'Reviewed',
}

export enum TestType {
  CBC = 'cbc',
  XRAY = 'X-Ray',
  BLOOD = 'Blood Test',
  OTHER = 'other',
}

export enum EmergencySeverity {
  LOW = 'info',
  MEDIUM = 'warning',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum QueueTier {
  EMERGENCY = 'emergency',
  SENIOR = 'senior',
  NEW = 'new',
  FOLLOWUP = 'followup',
  WALKIN = 'walkin',
}

export enum SocketEvent {
  QUEUE_UPDATED = 'queue_updated',
  REPORT_READY = 'report_ready',
  DOCTOR_STATUS = 'doctor_status',
  PATIENT_STATUS_CHANGED = 'patient_status_changed',
}

export enum NotificationType {
  REPORT_READY = 'report_ready',
  QUEUE_UPDATE = 'queue_update',
  DOCTOR_STATUS = 'doctor_status',
  PATIENT_STATUS_CHANGED = 'patient_status_changed',
}

export enum TokenPrefix {
  NEW = 'APT',
  FUP = 'FUP',
  WALKIN = 'WLK',
}

export enum AuditActorRole {
  PATIENT = 'patient',
  RECEPTION = 'receptionist',
  DOCTOR = 'doctor',
  LAB = 'lab',
  ADMIN = 'admin',
}

// Added Missing Database Enums
export enum TokenType {
  APPOINTMENT = 'Appointment',
  WALKIN = 'Walk-in',
}

export enum PatientStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  WAITING = 'WAITING',
}

export enum ConsultationStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
}

export enum FollowupStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  PENDING = 'pending',
}

export enum WalkinStatus {
  IN_CONSULTATION = 'in_consultation',
  WAITING = 'waiting',
  REGISTERED = 'registered',
}

export enum PlacementType {
  EMERGENCY = 'emergency',
  STANDARD = 'standard',
  PRIORITY = 'priority',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export enum UploadedBy {
  PATIENT = 'Patient',
}

export enum AdminLevel {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',
}

export enum NotificationCategory {
  APPOINTMENT = 'appointment',
  QUEUE = 'queue',
  BILLING = 'billing',
  SYSTEM = 'system',
}
