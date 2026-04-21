import express from 'express';
import { getClassSchedule, getAvailableTerms } from '../controllers/classschedule.controller.js';
import authenticate from '../authorization/authorization.js';

const router = express.Router();

// Get available term codes
router.get('/terms', authenticate, getAvailableTerms);

// Get class schedule for a user
router.get('/:userId/:termCode', authenticate, getClassSchedule);

export default router;