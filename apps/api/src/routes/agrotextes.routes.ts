import { Router } from 'express';
import { generateTexts, getTexts, updateText, deleteText, deleteTexts } from '../controllers/agrotextes.controller';

const router = Router();

router.post('/generate', generateTexts);
router.get('/texts', getTexts);
router.put('/texts/:id', updateText);
router.delete('/texts/:id', deleteText);
router.delete('/texts', deleteTexts);

export default router;
