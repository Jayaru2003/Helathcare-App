import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import router from './routes/index';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3004', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, service: 'prescription', status: 'healthy', database: dbStatus, timestamp: new Date().toISOString() });
});

app.use('/api/v1/prescriptions', router);

app.use((_req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Route not found' });
});

app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode ?? 500;
  res.status(status).json({
    success: false, statusCode: status,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server FIRST so that ECS/Docker health checks pass and container starts successfully
const server = app.listen(PORT, () => {
  console.info(`[Prescription Service] Listening on port ${PORT}`);
});

// Connect to MongoDB asynchronously AFTER the server starts
const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/healthbridge';
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10_000,
})
.then(() => {
  console.info('[Prescription Service] MongoDB connected');
})
.catch(err => {
  console.error('[Prescription Service] MongoDB connection failed:', err);
  // Do not process.exit(1) to allow the container to remain alive and retry or report unhealthiness gracefully
});

export default app;

