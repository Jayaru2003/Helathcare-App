import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { verifyJWT, validateRequest } from '@healthbridge/middleware';
import { createAppointmentSchema, updateAppointmentSchema } from '../services/appointment.service';

const router = Router();

router.use(verifyJWT);

router.get('/', AppointmentController.list);
router.post('/', validateRequest(createAppointmentSchema), AppointmentController.create);
router.get('/slots', AppointmentController.getAvailableSlots);
router.get('/:id', AppointmentController.getById);
router.put('/:id', validateRequest(updateAppointmentSchema), AppointmentController.update);
router.patch('/:id/cancel', AppointmentController.cancel);
router.patch('/:id/complete', AppointmentController.complete);

export default router;
