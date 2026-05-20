import { createKafkaClient, KAFKA_TOPICS } from '@healthbridge/kafka';
import { EachMessagePayload } from 'kafkajs';
import { BillingService } from './billing.service';

export class BillingKafkaConsumer {
  static async start(): Promise<void> {
    const kafka = createKafkaClient('billing-service');
    await kafka.connect();

    // Listen for appointment created events to auto-generate invoices
    await kafka.consume(KAFKA_TOPICS.APPOINTMENT_CREATED, async (payload: EachMessagePayload) => {
      const message = kafka.parseMessage<{ appointmentId: string; patientId: string; fee?: number }>(payload.message);
      console.info('[Billing] Received appointment.created event:', message.appointmentId);
      // Auto-create draft invoice for appointment
      await BillingService.createInvoice({
        patientId: message.patientId,
        appointmentId: message.appointmentId,
        lineItems: [{
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: message.fee ?? 100,
          discount: 0,
          tax: 0,
        }],
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });
  }
}
