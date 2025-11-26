import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { UserRole } from '@/lib/db/types';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials?.email);
        if (!credentials) return null;

        try {
          const { email, password } = loginSchema.parse(credentials);

          // Get user from database
          const user = await db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', email)
            .where('is_active', '=', true)
            .executeTakeFirst();

          console.log('User found:', !!user);
          
          if (!user) {
            console.log('No user found for email:', email);
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password_hash);
          console.log('Password valid:', isPasswordValid);
          
          if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return null;
          }

          // Update last login
          await db
            .updateTable('users')
            .set({ last_login: new Date() })
            .where('id', '=', user.id)
            .execute();

          // Return user object for session
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            employeeId: user.employee_id,
          };
          console.log('Returning auth user:', authUser);
          return authUser;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user);
      console.log('JWT callback - token before:', token);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.employeeId = user.employeeId;
      }
      console.log('JWT callback - token after:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      console.log('Session callback - session before:', session);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.employeeId = token.employeeId as string | null;
      }
      console.log('Session callback - session after:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};