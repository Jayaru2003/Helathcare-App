import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index';
import { AppointmentKafkaService } from './services/appointment-kafka.service';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3003', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'appointment', status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/v1/appointments', router);

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

app.listen(PORT, async () => {
  console.info(`[Appointment Service] Listening on port ${PORT}`);
  // Connect Kafka producer in background
  AppointmentKafkaService.connect().catch((err) =>
    console.error('[Appointment Service] Kafka connect failed:', err)
  );
});

export default app;
