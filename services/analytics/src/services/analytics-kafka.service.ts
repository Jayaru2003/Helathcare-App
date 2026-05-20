import { createKafkaClient, KAFKA_TOPICS } from '@healthbridge/kafka';
import { EachMessagePayload } from 'kafkajs';

export class AnalyticsKafkaConsumer {
  static async start(): Promise<void> {
    const kafka = createKafkaClient('analytics-service');
    await kafka.connect();

    const topics = Object.values(KAFKA_TOPICS);
    
    await kafka.consumeMany(topics, async (payload: EachMessagePayload) => {
      // In production, write this to Elasticsearch/OpenSearch
      console.info(`[Analytics] Indexed event from ${payload.topic} at ${new Date().toISOString()}`);
    });
  }
}
