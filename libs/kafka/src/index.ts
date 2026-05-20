import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ProducerRecord,
  Message,
  EachMessagePayload,
  logLevel,
} from 'kafkajs';

export interface KafkaMessage {
  key?: string;
  value: Record<string, unknown> | string;
  headers?: Record<string, string>;
}

export type MessageHandler = (
  payload: EachMessagePayload
) => Promise<void>;

export interface HealthBridgeKafkaConfig {
  clientId: string;
  brokers: string[];
  groupId?: string;
  ssl?: boolean;
  sasl?: KafkaConfig['sasl'];
}

export class HealthBridgeKafka {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private readonly groupId: string;

  constructor(config: HealthBridgeKafkaConfig) {
    this.groupId = config.groupId ?? `${config.clientId}-group`;

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
  }

  // ─── Producer ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.producer) return; // already connected

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30_000,
    });

    await this.producer.connect();
    console.info('[Kafka] Producer connected');
  }

  async disconnect(): Promise<void> {
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

  async produce(topic: string, message: KafkaMessage): Promise<void> {
    if (!this.producer) {
      throw new Error('[Kafka] Producer not connected. Call connect() first.');
    }

    const kafkaMessage: Message = {
      key: message.key ?? null,
      value:
        typeof message.value === 'string'
          ? message.value
          : JSON.stringify(message.value),
      headers: message.headers,
    };

    const record: ProducerRecord = {
      topic,
      messages: [kafkaMessage],
    };

    await this.producer.send(record);
  }

  async produceMany(topic: string, messages: KafkaMessage[]): Promise<void> {
    if (!this.producer) {
      throw new Error('[Kafka] Producer not connected. Call connect() first.');
    }

    const kafkaMessages: Message[] = messages.map((msg) => ({
      key: msg.key ?? null,
      value:
        typeof msg.value === 'string'
          ? msg.value
          : JSON.stringify(msg.value),
      headers: msg.headers,
    }));

    await this.producer.send({ topic, messages: kafkaMessages });
  }

  // ─── Consumer ─────────────────────────────────────────────────────────────

  async consume(topic: string, handler: MessageHandler): Promise<void> {
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
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await handler(payload);
        } catch (err) {
          console.error(
            `[Kafka] Error processing message from topic "${topic}":`,
            err
          );
          // Don't rethrow — allows the consumer to continue processing
        }
      },
    });

    this.consumers.set(topic, consumer);
    console.info(`[Kafka] Consumer subscribed to topic "${topic}"`);
  }

  async consumeMany(
    topics: string[],
    handler: MessageHandler
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: this.groupId,
    });

    await consumer.connect();

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      this.consumers.set(topic, consumer);
    }

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await handler(payload);
        } catch (err) {
          console.error('[Kafka] Error processing message:', err);
        }
      },
    });

    console.info(`[Kafka] Consumer subscribed to topics: ${topics.join(', ')}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  parseMessage<T = Record<string, unknown>>(
    message: EachMessagePayload['message']
  ): T {
    const raw = message.value?.toString();
    if (!raw) throw new Error('[Kafka] Empty message value');
    return JSON.parse(raw) as T;
  }

  async createTopics(
    topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>
  ): Promise<void> {
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

// ─── Well-known topics ────────────────────────────────────────────────────────

export const KAFKA_TOPICS = {
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
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// ─── Factory helper ──────────────────────────────────────────────────────────

export function createKafkaClient(
  clientId: string,
  overrides: Partial<HealthBridgeKafkaConfig> = {}
): HealthBridgeKafka {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

  return new HealthBridgeKafka({
    clientId,
    brokers,
    groupId: process.env.KAFKA_GROUP_ID ?? `${clientId}-group`,
    ...overrides,
  });
}

export default HealthBridgeKafka;
