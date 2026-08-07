import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

let adminApp;

// Graceful initialization check
if (getApps().length === 0) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // Prevent crashing if the dummy key from the example is still in the .env file
    if (privateKey && privateKey.includes('MIICXAIBAAKCAQEA0123456789')) {
      throw new Error('Placeholder private key detected.');
    }

    if (privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
      console.log('🔥 Firebase Admin SDK initialized successfully with Service Account.');
    } else {
      throw new Error('No private key or client email provided.');
    }
  } catch (error) {
    console.log(`⚠️ Firebase Admin Init Notice: ${error.message}`);
    console.log('⚠️ Initializing Firebase in default mock/development mode.');
    
    // Guaranteed fallback initialization so the server never crashes
    adminApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'evidencehub-ai'
    });
  }
} else {
  adminApp = getApps()[0];
}

// Export Auth, Firestore, and Storage Services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);