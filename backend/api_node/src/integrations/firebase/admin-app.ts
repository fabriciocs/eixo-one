import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import type { AppEnv } from '../../config/env.js';

export type FirebaseClients = {
  auth: Auth;
  firestore: Firestore;
  projectId: string;
};

export function createFirebaseClients(env: AppEnv): FirebaseClients {
  const serviceAccount = env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : undefined;
  const usingEmulators = Boolean(
    env.FIREBASE_AUTH_EMULATOR_HOST ||
      env.FIRESTORE_EMULATOR_HOST ||
      env.STORAGE_EMULATOR_HOST,
  );

  const app =
    getApps()[0] ??
    initializeApp(
      serviceAccount
        ? {
            projectId: env.FIREBASE_PROJECT_ID,
            credential: cert(serviceAccount),
          }
        : usingEmulators
          ? {
              projectId: env.FIREBASE_PROJECT_ID,
            }
          : {
              projectId: env.FIREBASE_PROJECT_ID,
              credential: applicationDefault(),
            },
    );

  return {
    auth: getAuth(app),
    firestore: getFirestore(app),
    projectId: env.FIREBASE_PROJECT_ID,
  };
}
