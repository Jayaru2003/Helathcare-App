import Stripe from 'stripe';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

// In-memory store for stub (replace with DB in production)
const invoices = new Map<string, Record<string, unknown>>();

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discount: z.number().min(0).max(100).default(0),
    tax: z.number().min(0).max(100).default(0),
  })).min(1),
  currency: z.string().length(3).default('USD'),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;

export class BillingService {
  static async findAll({ page, limit, patientId }: { page: number; limit: number; patientId?: string }) {
    const all = [...invoices.values()].filter((inv) => !patientId || inv['patientId'] === patientId);
    const total = all.length;
    const skip = (page - 1) * limit;
    const data = all.slice(skip, skip + limit);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  static async findById(id: string) {
    return invoices.get(id) ?? null;
  }

  static async createInvoice(dto: CreateInvoiceDto) {
    const lineItems = dto.lineItems.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmt = subtotal * (item.discount / 100);
      const taxAmt = (subtotal - discountAmt) * (item.tax / 100);
      return { ...item, total: subtotal - discountAmt + taxAmt };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const invoice = {
      id: uuidv4(),
      invoiceNumber: `INV-${Date.now()}`,
      ...dto,
      lineItems,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoices.set(invoice.id, invoice);
    return invoice;
  }

  static async createPaymentIntent(invoiceId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    if (invoice['status'] === 'paid') throw Object.assign(new Error('Invoice already paid'), { statusCode: 400 });

    if (!stripe) throw Object.assign(new Error('Stripe not configured'), { statusCode: 503 });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((invoice['total'] as number) * 100),
      currency: (invoice['currency'] as string).toLowerCase(),
      metadata: { invoiceId, patientId: invoice['patientId'] as string },
    });

    invoices.set(invoiceId, { ...invoice, stripePaymentIntentId: paymentIntent.id });

    return { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id };
  }

  static async updateStatus(id: string, status: string) {
    const invoice = invoices.get(id);
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    const updated = { ...invoice, status, updatedAt: new Date().toISOString() };
    invoices.set(id, updated);
    return updated;
  }

  static async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('[Billing] Stripe webhook not configured');
      return;
    }
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata['invoiceId'];
        if (invoiceId) await BillingService.updateStatus(invoiceId, 'paid');
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata['invoiceId'];
        if (invoiceId) await BillingService.updateStatus(invoiceId, 'pending');
        break;
      }
      default:
        console.info(`[Billing] Unhandled Stripe event: ${event.type}`);
    }
  }
}
