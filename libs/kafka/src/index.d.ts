import { KafkaConfig, EachMessagePayload } from 'kafkajs';
export interface KafkaMessage {
    key?: string;
    value: Record<string, unknown> | string;
    headers?: Record<string, string>;
}
export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;
export interface HealthBridgeKafkaConfig {
    clientId: string;
    brokers: string[];
    groupId?: string;
    ssl?: boolean;
    sasl?: KafkaConfig['sasl'];
}
export declare class HealthBridgeKafka {
    private kafka;
    private producer;
    private consumers;
    private readonly groupId;
    constructor(config: HealthBridgeKafkaConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    produce(topic: string, message: KafkaMessage): Promise<void>;
    produceMany(topic: string, messages: KafkaMessage[]): Promise<void>;
    consume(topic: string, handler: MessageHandler): Promise<void>;
    consumeMany(topics: string[], handler: MessageHandler): Promise<void>;
    parseMessage<T = Record<string, unknown>>(message: EachMessagePayload['message']): T;
    createTopics(topics: Array<{
        topic: string;
        numPartitions?: number;
        replicationFactor?: number;
    }>): Promise<void>;
}
export declare const KAFKA_TOPICS: {
    readonly APPOINTMENT_CREATED: "appointment.created";
    readonly APPOINTMENT_UPDATED: "appointment.updated";
    readonly APPOINTMENT_CANCELLED: "appointment.cancelled";
    readonly PRESCRIPTION_CREATED: "prescription.created";
    readonly BILLING_INVOICE_CREATED: "billing.invoice.created";
    readonly BILLING_PAYMENT_COMPLETED: "billing.payment.completed";
    readonly NOTIFICATION_EMAIL: "notification.email";
    readonly NOTIFICATION_SMS: "notification.sms";
    readonly ANALYTICS_EVENT: "analytics.event";
    readonly PATIENT_CREATED: "patient.created";
    readonly PATIENT_UPDATED: "patient.updated";
};
export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
export declare function createKafkaClient(clientId: string, overrides?: Partial<HealthBridgeKafkaConfig>): HealthBridgeKafka;
export default HealthBridgeKafka;
//# sourceMappingURL=index.d.ts.map