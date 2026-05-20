"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_TOPICS = exports.HealthBridgeKafka = void 0;
exports.createKafkaClient = createKafkaClient;
const kafkajs_1 = require("kafkajs");
class HealthBridgeKafka {
    kafka;
    producer = null;
    consumers = new Map();
    groupId;
    constructor(config) {
        this.groupId = config.groupId ?? `${config.clientId}-group`;
        this.kafka = new kafkajs_1.Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
            ssl: config.ssl,
            sasl: config.sasl,
            logLevel: kafkajs_1.logLevel.WARN,
            retry: {
                initialRetryTime: 300,
                retries: 8,
            },
        });
    }
    // ─── Producer ─────────────────────────────────────────────────────────────
    async connect() {
        if (this.producer)
            return; // already connected
        this.producer = this.kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30_000,
        });
        await this.producer.connect();
        console.info('[Kafka] Producer connected');
    }
    async disconnect() {
        if (this.producer) {
            await this.producer.disconnect();
            this.producer = null;
            console.info('[Kafka] Producer disconnected');
        }
        for (const [topic, consumer] of this.consumers) {
            await consumer.disconnect();
            console.info(`[Kafka] Consumer for topic "${topic}" disconnected`);
        }
        this.consumers.clear();
    }
    async produce(topic, message) {
        if (!this.producer) {
            throw new Error('[Kafka] Producer not connected. Call connect() first.');
        }
        const kafkaMessage = {
            key: message.key ?? null,
            value: typeof message.value === 'string'
                ? message.value
                : JSON.stringify(message.value),
            headers: message.headers,
        };
        const record = {
            topic,
            messages: [kafkaMessage],
        };
        await this.producer.send(record);
    }
    async produceMany(topic, messages) {
        if (!this.producer) {
            throw new Error('[Kafka] Producer not connected. Call connect() first.');
        }
        const kafkaMessages = messages.map((msg) => ({
            key: msg.key ?? null,
            value: typeof msg.value === 'string'
                ? msg.value
                : JSON.stringify(msg.value),
            headers: msg.headers,
        }));
        await this.producer.send({ topic, messages: kafkaMessages });
    }
    // ─── Consumer ─────────────────────────────────────────────────────────────
    async consume(topic, handler) {
        if (this.consumers.has(topic)) {
            console.warn(`[Kafka] Already consuming topic "${topic}"`);
            return;
        }
        const consumer = this.kafka.consumer({
            groupId: this.groupId,
            sessionTimeout: 30_000,
            heartbeatInterval: 3_000,
        });
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async (payload) => {
                try {
                    await handler(payload);
                }
                catch (err) {
                    console.error(`[Kafka] Error processing message from topic "${topic}":`, err);
                    // Don't rethrow — allows the consumer to continue processing
                }
            },
        });
        this.consumers.set(topic, consumer);
        console.info(`[Kafka] Consumer subscribed to topic "${topic}"`);
    }
    async consumeMany(topics, handler) {
        const consumer = this.kafka.consumer({
            groupId: this.groupId,
        });
        await consumer.connect();
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
            this.consumers.set(topic, consumer);
        }
        await consumer.run({
            eachMessage: async (payload) => {
                try {
                    await handler(payload);
                }
                catch (err) {
                    console.error('[Kafka] Error processing message:', err);
                }
            },
        });
        console.info(`[Kafka] Consumer subscribed to topics: ${topics.join(', ')}`);
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────
    parseMessage(message) {
        const raw = message.value?.toString();
        if (!raw)
            throw new Error('[Kafka] Empty message value');
        return JSON.parse(raw);
    }
    async createTopics(topics) {
        const admin = this.kafka.admin();
        await admin.connect();
        await admin.createTopics({
            waitForLeaders: true,
            topics: topics.map((t) => ({
                topic: t.topic,
                numPartitions: t.numPartitions ?? 3,
                replicationFactor: t.replicationFactor ?? 1,
            })),
        });
        await admin.disconnect();
        console.info('[Kafka] Topics created:', topics.map((t) => t.topic).join(', '));
    }
}
exports.HealthBridgeKafka = HealthBridgeKafka;
// ─── Well-known topics ────────────────────────────────────────────────────────
exports.KAFKA_TOPICS = {
    APPOINTMENT_CREATED: 'appointment.created',
    APPOINTMENT_UPDATED: 'appointment.updated',
    APPOINTMENT_CANCELLED: 'appointment.cancelled',
    PRESCRIPTION_CREATED: 'prescription.created',
    BILLING_INVOICE_CREATED: 'billing.invoice.created',
    BILLING_PAYMENT_COMPLETED: 'billing.payment.completed',
    NOTIFICATION_EMAIL: 'notification.email',
    NOTIFICATION_SMS: 'notification.sms',
    ANALYTICS_EVENT: 'analytics.event',
    PATIENT_CREATED: 'patient.created',
    PATIENT_UPDATED: 'patient.updated',
};
// ─── Factory helper ──────────────────────────────────────────────────────────
function createKafkaClient(clientId, overrides = {}) {
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
    return new HealthBridgeKafka({
        clientId,
        brokers,
        groupId: process.env.KAFKA_GROUP_ID ?? `${clientId}-group`,
        ...overrides,
    });
}
exports.default = HealthBridgeKafka;
//# sourceMappingURL=index.js.map