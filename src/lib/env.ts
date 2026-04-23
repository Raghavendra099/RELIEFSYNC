import { z } from 'zod'

const EnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  VITE_FUNCTIONS_BASE_URL: z.string().url().optional(),
})

export type AppEnv = z.infer<typeof EnvSchema>

export const env: AppEnv = EnvSchema.parse(import.meta.env)

export const isFirebaseConfigured =
  !!env.VITE_FIREBASE_API_KEY &&
  !!env.VITE_FIREBASE_AUTH_DOMAIN &&
  !!env.VITE_FIREBASE_PROJECT_ID &&
  !!env.VITE_FIREBASE_APP_ID

