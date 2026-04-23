import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'

import { env, isFirebaseConfigured } from './env'

export const isDemoMode = !isFirebaseConfigured

export const firebaseApp = isFirebaseConfigured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    })
  : null

export const db = firebaseApp ? getFirestore(firebaseApp) : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null

export async function ensureSignedIn() {
  if (!auth) return
  if (auth.currentUser) return
  await signInAnonymously(auth)
}

export async function enableOfflinePersistence() {
  if (!db) return
  try {
    await enableIndexedDbPersistence(db)
  } catch {
    // Multiple tabs or unsupported browser; still usable online.
  }
}

