import 'dotenv/config';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AnalyticsKafkaConsumer } from './services/analytics-kafka.service';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3007', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'analytics', status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.info(`[Analytics Service] Listening on port ${PORT}`);
  AnalyticsKafkaConsumer.start().catch((err) =>
    console.error('[Analytics] Kafka consumer start failed:', err)
  );
});

export default app;
