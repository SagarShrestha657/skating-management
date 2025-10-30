import express from 'express';
import { createSession, getActiveSessions, deleteSession, getAnalyticsKpis, getAnalyticsTransactions, getWeeklySales, editSession, deleteSessionPermanently } from '../controllers/sessionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createSession);
router.get('/active', protect, getActiveSessions);
router.delete('/:id', protect, deleteSession); // This is now the "complete" action (soft delete)
router.put('/:id', protect, editSession); // Route for editing a session
router.delete('/permanent/:id', protect, deleteSessionPermanently); // New route for permanent deletion
router.get('/analytics/kpis', protect, admin, getAnalyticsKpis);
router.get('/analytics/transactions', protect, admin, getAnalyticsTransactions);
router.get('/analytics/weekly', protect, admin, getWeeklySales);

export default router;