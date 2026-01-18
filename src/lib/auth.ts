import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI env variable");
}

if (!process.env.MONGODB_DB) {
  throw new Error("Please add your MONGODB_DB env variable");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.MONGODB_DB);

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
