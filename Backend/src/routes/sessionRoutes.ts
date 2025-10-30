import express from 'express';
import { createSession, getActiveSessions, deleteSession, getAnalyticsKpis, getAnalyticsTransactions, getWeeklySales, editSession, deleteSessionPermanently } from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/active', getActiveSessions);
router.delete('/:id', deleteSession); // This is now the "complete" action (soft delete)
router.put('/:id', editSession); // Route for editing a session
router.delete('/permanent/:id', deleteSessionPermanently); // New route for permanent deletion
router.get('/analytics/kpis', getAnalyticsKpis);
router.get('/analytics/transactions', getAnalyticsTransactions);
router.get('/analytics/weekly', getWeeklySales);

export default router;