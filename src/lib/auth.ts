import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/db/connection';
import User from '@/db/models/User';
import type { User as UserType } from '@/types';

// ============================================
// NextAuth Configuration
// ============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        try {
          await connectToDatabase();

          // Find user by email and include password field
          const user = await User.findOne({ email }).select('+password');

          if (!user) {
            return null;
          }

          // Check if account is locked
          if (user.isLocked()) {
            return null;
          }

          // Check if account is suspended or banned
          if (user.status === 'suspended' || user.status === 'banned') {
            return null;
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(password);

          if (!isPasswordValid) {
            // Increment login attempts
            user.loginAttempts += 1;
            
            // Lock account after 5 failed attempts for 15 minutes
            if (user.loginAttempts >= 5) {
              user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            
            await user.save();
            return null;
          }

          // Reset login attempts on successful login
          user.loginAttempts = 0;
          user.lockUntil = undefined;
          user.lastLoginAt = new Date();
          
          // Activate pending accounts on first successful login
          if (user.status === 'pending' && user.emailVerified) {
            user.status = 'active';
          }
          
          await user.save();

          console.log(`✅ User logged in: ${user.email} (${user.role})`);

          // Return user object for session
          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            status: user.status,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/dashboard',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isEmailVerified = Boolean((user as unknown as { emailVerified: boolean }).emailVerified);
        token.status = user.status;
      }

      // Update session if triggered
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.role = token.role as UserType['role'];
        session.user.avatar = token.avatar as string | undefined;
        (session.user as unknown as { emailVerified: boolean }).emailVerified = token.isEmailVerified as boolean;
        session.user.status = token.status as UserType['status'];
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut() {
      console.log('User signed out');
    },
  },

  debug: process.env.NODE_ENV === 'development',
});

// ============================================
// Type Augmentation for NextAuth
// ============================================

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserType['role'];
    avatar?: string;
    status: UserType['status'];
  }

  interface Session {
    user: User & {
      emailVerified: boolean;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserType['role'];
    avatar?: string;
    isEmailVerified: boolean;
    status: UserType['status'];
  }
}
