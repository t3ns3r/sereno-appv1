import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccount) {
        console.warn('Firebase service account key not found. Push notifications will be simulated.');
        return null;
      }

      const serviceAccountKey = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return null;
  }
};

export const firebaseAdmin = initializeFirebase();
export const messaging = firebaseAdmin ? admin.messaging() : null;