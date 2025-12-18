import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.put(
  '/me',
  validate([
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
  ]),
  userController.updateProfile
);
router.delete('/me', userController.deleteAccount);

export default router;
