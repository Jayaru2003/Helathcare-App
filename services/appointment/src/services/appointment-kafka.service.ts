import { createKafkaClient, HealthBridgeKafka, KafkaMessage } from '@healthbridge/kafka';

let kafkaClient: HealthBridgeKafka | null = null;

export class AppointmentKafkaService {
  static async connect(): Promise<void> {
    kafkaClient = createKafkaClient('appointment-service');
    await kafkaClient.connect();
  }

  static async produce(topic: string, message: KafkaMessage): Promise<void> {
    if (!kafkaClient) {
      console.warn('[AppointmentKafka] Producer not connected, skipping event publish');
      return;
    }
    await kafkaClient.produce(topic, message);
  }

  static async disconnect(): Promise<void> {
    if (kafkaClient) await kafkaClient.disconnect();
  }
}
