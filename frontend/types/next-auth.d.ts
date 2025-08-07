import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      email?: string | null
      name?: string | null
      image?: string | null
      isAdmin?: boolean
      provider?: string
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    accessToken?: string
    isAdmin?: boolean
    provider?: string
  }
}