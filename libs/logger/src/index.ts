import winston, { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
  enableCloudWatch?: boolean;
  cloudWatch?: {
    logGroupName: string;
    logStreamName: string;
    awsRegion?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    uploadRate?: number;
    retentionInDays?: number;
  };
}

// ─── Formats ──────────────────────────────────────────────────────────────────

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, service, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] [${service}] ${level}: ${message}${metaStr}${stackStr}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAppLogger(options: LoggerOptions): Logger {
  const {
    service,
    level = 'info',
    enableCloudWatch = false,
    cloudWatch,
  } = options;

  const isDev = process.env.NODE_ENV !== 'production';

  const logTransports: winston.transport[] = [
    new transports.Console({
      format: isDev ? devFormat : prodFormat,
    }),
  ];

  if (!isDev) {
    logTransports.push(
      new transports.File({
        filename: `logs/${service}-error.log`,
        level: 'error',
        format: prodFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
      new transports.File({
        filename: `logs/${service}-combined.log`,
        format: prodFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
      }),
    );
  }

  if (enableCloudWatch && cloudWatch) {
    // Dynamic import to avoid errors when winston-cloudwatch is not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WinstonCloudWatch = require('winston-cloudwatch');
      logTransports.push(
        new WinstonCloudWatch({
          logGroupName: cloudWatch.logGroupName,
          logStreamName: cloudWatch.logStreamName,
          awsRegion: cloudWatch.awsRegion || process.env.AWS_REGION || 'us-east-1',
          awsAccessKeyId: cloudWatch.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
          awsSecretAccessKey: cloudWatch.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
          uploadRate: cloudWatch.uploadRate || 2000,
          retentionInDays: cloudWatch.retentionInDays || 30,
          jsonMessage: true,
        }),
      );
    } catch {
      console.warn('[Logger] winston-cloudwatch not available, skipping CloudWatch transport');
    }
  }

  const logger = createLogger({
    level,
    defaultMeta: { service },
    transports: logTransports,
    exitOnError: false,
  });

  return logger;
}

// ─── Default logger (fallback, override per-service) ──────────────────────────

export const logger = createAppLogger({
  service: process.env.SERVICE_NAME || 'healthbridge',
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableCloudWatch: process.env.ENABLE_CLOUDWATCH === 'true',
  cloudWatch: {
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/healthbridge/default',
    logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'default',
  },
});

export { Logger };
export default logger;
