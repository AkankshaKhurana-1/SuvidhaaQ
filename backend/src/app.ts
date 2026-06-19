import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import Middlewares
import { errorMiddleware } from './middleware/error.middleware';
import { hospitalMiddleware } from './middleware/hospital.middleware';

// Import Routes for Pruned Modules
import adminRoutes from './routes/admin.routes';
import appointmentRoutes from './routes/appointment.routes';
import doctorRoutes from './routes/doctor.routes';
import reportRoutes from './routes/report.routes';
import tokenRoutes from './routes/token.routes';

const app = express();

// Apply Security and Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hospital tenant routing resolver
app.use(hospitalMiddleware);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register Retained API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/token', tokenRoutes);

// Global Error Handler Middleware (MUST be registered last)
app.use(errorMiddleware);

export default app;
