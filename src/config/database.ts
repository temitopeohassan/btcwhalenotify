import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

let firestore: Firestore;

try {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      logger.warn('Firebase service account not configured. Using default credentials.');
      initializeApp();
    }
  }

  firestore = getFirestore();
  logger.info('✅ Firebase Firestore connected');
} catch (err) {
  logger.error('❌ Firebase initialization failed:', err);
  throw err;
}

export default firestore;
