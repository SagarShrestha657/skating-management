import { Router } from 'express';
import { subscribe } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/subscribe').post(protect, subscribe);

export default router;