import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3002', 10);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'patient', status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/v1/patients', router);

app.use((_req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Route not found' });
});

app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode ?? 500;
  res.status(status).json({
    success: false,
    statusCode: status,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.info(`[Patient Service] Listening on port ${PORT}`);
});

export default app;
