import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index';
import { BillingKafkaConsumer } from './services/billing-kafka.service';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3005', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));

// Raw body for Stripe webhook signature verification
app.use('/api/v1/billing/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'billing', status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/v1/billing', router);

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
  console.info(`[Billing Service] Listening on port ${PORT}`);
  BillingKafkaConsumer.start().catch((err) =>
    console.error('[Billing] Kafka consumer start failed:', err)
  );
});

export default app;

