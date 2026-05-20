"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = void 0;
exports.createAppLogger = createAppLogger;
const winston_1 = require("winston");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return winston_1.Logger; } });
const { combine, timestamp, printf, colorize, errors, json } = winston_1.format;
// ─── Formats ──────────────────────────────────────────────────────────────────
const devFormat = combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), errors({ stack: true }), printf(({ timestamp, level, message, service, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] [${service}] ${level}: ${message}${metaStr}${stackStr}`;
}));
const prodFormat = combine(timestamp(), errors({ stack: true }), json());
// ─── Factory ──────────────────────────────────────────────────────────────────
function createAppLogger(options) {
    const { service, level = 'info', enableCloudWatch = false, cloudWatch, } = options;
    const isDev = process.env.NODE_ENV !== 'production';
    const logTransports = [
        new winston_1.transports.Console({
            format: isDev ? devFormat : prodFormat,
        }),
    ];
    if (!isDev) {
        logTransports.push(new winston_1.transports.File({
            filename: `logs/${service}-error.log`,
            level: 'error',
            format: prodFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }), new winston_1.transports.File({
            filename: `logs/${service}-combined.log`,
            format: prodFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }));
    }
    if (enableCloudWatch && cloudWatch) {
        // Dynamic import to avoid errors when winston-cloudwatch is not installed
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const WinstonCloudWatch = require('winston-cloudwatch');
            logTransports.push(new WinstonCloudWatch({
                logGroupName: cloudWatch.logGroupName,
                logStreamName: cloudWatch.logStreamName,
                awsRegion: cloudWatch.awsRegion || process.env.AWS_REGION || 'us-east-1',
                awsAccessKeyId: cloudWatch.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
                awsSecretAccessKey: cloudWatch.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
                uploadRate: cloudWatch.uploadRate || 2000,
                retentionInDays: cloudWatch.retentionInDays || 30,
                jsonMessage: true,
            }));
        }
        catch {
            console.warn('[Logger] winston-cloudwatch not available, skipping CloudWatch transport');
        }
    }
    const logger = (0, winston_1.createLogger)({
        level,
        defaultMeta: { service },
        transports: logTransports,
        exitOnError: false,
    });
    return logger;
}
// ─── Default logger (fallback, override per-service) ──────────────────────────
exports.logger = createAppLogger({
    service: process.env.SERVICE_NAME || 'healthbridge',
    level: process.env.LOG_LEVEL || 'info',
    enableCloudWatch: process.env.ENABLE_CLOUDWATCH === 'true',
    cloudWatch: {
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/healthbridge/default',
        logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'default',
    },
});
exports.default = exports.logger;
//# sourceMappingURL=index.js.map