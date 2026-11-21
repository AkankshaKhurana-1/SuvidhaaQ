# ⚖️ Queue Allocation & Priority Rules

The queue engine eliminates waiting congestion by dynamically scoring and ordering patients in real time.

---

## 🎯 Allocation Strategy

| Patient Category | Target Ratio | Token Prefix |
| :--- | :--- | :--- |
| **New Consultations** | 50% | `A` (Appointment) |
| **Follow-Up Consultations** | 20% | `A` (Appointment) |
| **Walk-In Patients** | 30% | `W` (Walk-In) |

---

## 🧠 Dynamic Priority Engine

Base priority scores are determined by patient category:

1. **Emergency Cases**: `Priority = 100` (Immediately jumps to head of queue).
2. **Senior Citizens (Age >= 65)**: `Bonus = +50 points` (Base score ~80).
3. **Scheduled Appointments**: `Base = 50 points`.
4. **Walk-In Patients**: `Base = 30 points`.

### 🛡️ Anti-Starvation Mechanism
To prevent walk-in or lower-priority patients from being starved indefinitely by incoming appointments:
- Every minute a patient waits in the queue adds `+0.1 points` to their dynamic priority score.
- The anti-starvation boost is capped at `+30 points` to protect emergency triage integrity.

---

## ⏱️ Dynamic ETA Calculation

Estimated Wait Time (minutes) for a patient at queue position `N`:

$$\text{ETA} = \max(0, \text{AvgDuration} - \text{ElapsedCurrent}) + (N - 1) \times \text{AvgDuration}$$

Where:
- $\text{AvgDuration}$: Doctor's historical average consultation duration (default: 15 mins).
- $\text{ElapsedCurrent}$: Minutes elapsed for the consultation currently in progress.
