import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();
        
        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          return null;
        }
        
        const isPasswordValid = await user.comparePassword(credentials.password);
        
        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // When the session is updated, update the token
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.createdAt = (user as any).createdAt || new Date().toISOString();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        // Include any other user properties you need
        session.userCreatedAt = token.createdAt as string;
        session.sessionCreatedAt = new Date().toISOString();
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true;
      }
      
      // Handle OAuth sign-ins
      try {
        await dbConnect();
        
        // Check if user exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user for OAuth sign-ins
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            password: Math.random().toString(36).slice(-8), // Random password for OAuth users
            image: user.image,
            emailVerified: new Date(),
          });
          
          // Create user profile
          await UserProfile.create({
            userId: newUser._id,
            displayName: user.name || '',
            email: user.email || '',
            initialHealthDataSubmitted: false,
          });
          
          user.id = newUser._id.toString();
        } else {
          user.id = existingUser._id.toString();
        }
        
        return true;
      } catch (error) {
        console.error('Error during OAuth sign in:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
