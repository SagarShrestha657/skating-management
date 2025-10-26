import { Router } from 'express';
import {
    createSession,
    getActiveSessions,
    deleteSession,
    getAnalyticsKpis,
    getAnalyticsTransactions,
    getWeeklySales,
} from '../controllers/sessionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.route('/').post(protect, createSession);

router.route('/active').get(protect, getActiveSessions);

router.route('/:id').delete(protect, deleteSession);

router.route('/analytics/kpis').get(protect, admin, getAnalyticsKpis);

router.route('/analytics/weekly').get(protect, admin, getWeeklySales);

router.route('/analytics/transactions').get(protect, admin, getAnalyticsTransactions);

export default router;