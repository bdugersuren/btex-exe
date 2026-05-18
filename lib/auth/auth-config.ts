import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from './password-utils'
import { Role } from '@/types/enums'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) return null

        if (!user.isActive) throw new Error('INACTIVE_USER')

        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        })

        return {
          id:       user.id,
          email:    user.email,
          fullName: user.fullName,
          role:     user.role as Role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.role     = user.role
        token.fullName = user.fullName
      }
      return token
    },
    async session({ session, token }) {
      session.user.id       = token.id as string
      session.user.role     = token.role as Role
      session.user.fullName = token.fullName as string
      return session
    },
  },
}
