import { Role } from './enums'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      fullName: string
      role: Role
    }
  }

  interface User {
    id: string
    email: string
    fullName: string
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    fullName: string
  }
}
