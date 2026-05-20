import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { verifyJWT, validateRequest } from '@healthbridge/middleware';
import { createInvoiceSchema } from '../services/billing.service';

const router = Router();

// Stripe webhook - no auth
router.post('/webhooks/stripe', BillingController.stripeWebhook);

router.use(verifyJWT);

router.get('/invoices', BillingController.listInvoices);
router.post('/invoices', validateRequest(createInvoiceSchema), BillingController.createInvoice);
router.get('/invoices/:id', BillingController.getInvoice);
router.post('/invoices/:id/payment-intent', BillingController.createPaymentIntent);
router.patch('/invoices/:id/status', BillingController.updateInvoiceStatus);

export default router;
