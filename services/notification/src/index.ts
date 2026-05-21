import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { NotificationKafkaConsumer } from './services/notification-kafka.service';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3006', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'notification', status: 'healthy', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Route not found' });
});

app.listen(PORT, async () => {
  console.info(`[Notification Service] Listening on port ${PORT}`);
  NotificationKafkaConsumer.start().catch((err) =>
    console.error('[Notification] Kafka consumer start failed:', err)
  );
});

export default app;

