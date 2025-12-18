import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const userId = await authService.verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
