import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';
import { verifyJWT, validateRequest } from '@healthbridge/middleware';
import { createPrescriptionSchema } from '../services/prescription.service';

const router = Router();
router.use(verifyJWT);

router.get('/', PrescriptionController.list);
router.post('/', validateRequest(createPrescriptionSchema), PrescriptionController.create);
router.get('/:id', PrescriptionController.getById);
router.get('/patient/:patientId', PrescriptionController.getByPatient);
router.patch('/:id/status', PrescriptionController.updateStatus);
router.post('/:id/refill', PrescriptionController.requestRefill);

export default router;
