import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  async signup(email: string, password: string, name?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        verificationToken,
        subscription: {
          create: {
            tier: 'free',
            status: 'active'
          }
        }
      }
    });

    // TODO: Send verification email
    logger.info(`New user registered: ${email}`);

    return this.generateTokens(user.id);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User logged in: ${email}`);
    return this.generateTokens(user.id);
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return { accessToken, userId };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export const authService = new AuthService();