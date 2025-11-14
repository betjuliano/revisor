import { Router } from 'express';
import {
  addCredits,
  getTransactions,
  getUsers,
  login,
  upgrade,
  useCredits,
  useFreeWords,
} from '../controllers/userController.js';

const router = Router();

router.post('/auth/login', login);
router.get('/users', getUsers);
router.get('/users/:id/transactions', getTransactions);
router.post('/users/:id/credits', addCredits);
router.post('/users/:id/credits/use', useCredits);
router.post('/users/:id/free-words', useFreeWords);
router.post('/users/:id/upgrade', upgrade);

export default router;
