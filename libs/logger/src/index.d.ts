import winston, { Logger } from 'winston';
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
export declare function createAppLogger(options: LoggerOptions): Logger;
export declare const logger: winston.Logger;
export { Logger };
export default logger;
//# sourceMappingURL=index.d.ts.map