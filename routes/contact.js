import express from 'express';
import { submitContact } from '../controllers/contactController.js';

const router = express.Router();

// POST: /api/contact/submit
router.post('/submit', submitContact);

export default router;