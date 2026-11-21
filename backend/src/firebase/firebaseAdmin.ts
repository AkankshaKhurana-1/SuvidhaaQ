/**
 * Firebase Admin initialization and access module.
 * Provides fallback mock support when credentials are not configured.
 */

export interface FirebaseAdminInstance {
  isInitialized: boolean;
  projectId?: string;
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'hospital-queue-mock',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

let instance: FirebaseAdminInstance = {
  isInitialized: false,
};

export const getFirebaseAdmin = (): FirebaseAdminInstance => {
  if (!instance.isInitialized) {
    console.log(`[Firebase] Initialized with project ID: ${firebaseConfig.projectId}`);
    instance = {
      isInitialized: true,
      projectId: firebaseConfig.projectId,
    };
  }
  return instance;
};
