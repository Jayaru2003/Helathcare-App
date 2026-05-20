import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { verifyJWT, validateRequest } from '@healthbridge/middleware';
import { createPatientSchema, updatePatientSchema } from '../services/patient.service';

const router = Router();

router.use(verifyJWT);

router.get('/', PatientController.list);
router.post('/', validateRequest(createPatientSchema), PatientController.create);
router.get('/:id', PatientController.getById);
router.put('/:id', validateRequest(updatePatientSchema), PatientController.update);
router.delete('/:id', PatientController.remove);
router.get('/:id/medical-records', PatientController.getMedicalRecords);
router.post('/:id/medical-records', PatientController.addMedicalRecord);

export default router;
