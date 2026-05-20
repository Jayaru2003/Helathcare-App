import { createKafkaClient, KAFKA_TOPICS } from '@healthbridge/kafka';
import { EachMessagePayload } from 'kafkajs';

export class NotificationKafkaConsumer {
  static async start(): Promise<void> {
    const kafka = createKafkaClient('notification-service');
    await kafka.connect();

    await kafka.consumeMany(
      [KAFKA_TOPICS.APPOINTMENT_CREATED, KAFKA_TOPICS.BILLING_INVOICE_CREATED],
      async (payload: EachMessagePayload) => {
        const message = kafka.parseMessage<any>(payload.message);
        
        switch (payload.topic) {
          case KAFKA_TOPICS.APPOINTMENT_CREATED:
            console.info(`[Notification] Sending appointment confirmation to patient ${message.patientId}`);
            // Stub for SES/SNS
            break;
            
          case KAFKA_TOPICS.BILLING_INVOICE_CREATED:
            console.info(`[Notification] Sending invoice ${message.invoiceNumber} to patient ${message.patientId}`);
            break;
            
          default:
            console.info(`[Notification] Received unhandled topic: ${payload.topic}`);
        }
      }
    );
  }
}
