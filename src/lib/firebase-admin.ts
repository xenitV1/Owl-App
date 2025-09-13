import admin from 'firebase-admin';

if (!admin.apps.length) {
  // For development, use Firebase config from environment
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // In development, we can use the Firebase project's service account
  // This requires FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL env vars
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    // For development without service account credentials, initialize without credentials
    // This will work for basic operations but token verification might not work
    admin.initializeApp({
      projectId,
    });
  }
}

export default admin;

export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw error;
  }
};