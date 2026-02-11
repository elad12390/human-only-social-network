import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'

const secret = process.env.BETTER_AUTH_SECRET || 'test-secret-do-not-use-in-production'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
    },
  }),
  secret,
  emailAndPassword: {
    enabled: true,
  },
})
