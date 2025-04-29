import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Type augmentation for next-auth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    sessionCreatedAt: string;
    userCreatedAt: string;
  }
}

// Create the handler using the imported authOptions
const handler = NextAuth(authOptions);

// Only export the handler functions
export { handler as GET, handler as POST };