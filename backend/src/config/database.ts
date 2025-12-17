import admin from 'firebase-admin'
import { logger } from '../utils/logger'

let firestore: FirebaseFirestore.Firestore

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string)
      ),
    })
  }

  firestore = admin.firestore()

  logger.info('✅ Firebase Firestore connected')
} catch (err) {
  logger.error('❌ Firebase initialization failed:', err)
  throw err
}

export default firestore
