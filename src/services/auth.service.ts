import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import firestore from '../config/database';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  async signup(email: string, password: string, name?: string) {
    const existingUser = await firestore.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const userId = uuidv4();

    const user = {
      id: userId,
      email,
      name,
      passwordHash,
      verificationToken,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(userId).set(user);

    // TODO: Send verification email
    logger.info(`New user registered: ${email}`);

    return this.generateTokens(userId);
  }

  async login(email: string, password: string) {
    const userSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      throw new Error('Invalid credentials');
    }

    const user = userSnapshot.docs[0].data();
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
