import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role:
    | "teacher"
    | "admin"
    | "controller"
    | "registral"
    | "superAdmin"
    | "parent";
  code?: string;
  schoolId?: string | null; // Multi-tenant field: null for darulkubra/superAdmin, set for school users
  schoolSlug?: string;
};

// Extend the default NextAuth session to include our custom properties
declare module "next-auth" {
  interface Session {
    user: AuthUser;
  }

  interface JWT {
    id: string;
    name: string;
    username: string;
    role: string;
    code?: string;
    schoolId?: string | null;
    schoolSlug?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password ||
          !credentials?.role
        ) {
          return null;
        }

        let user = null;
        let role = credentials.role;
        let code = "";

        // Check controllers
        if (role === "controller") {
          try {
            user = await prisma.wpos_wpdatatable_28.findFirst({
              where: { username: credentials.username },
              include: {
                school: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                  },
                },
              },
            });
            if (!user) {
              return null;
            }
            if (!user.password) {
              return null;
            }

            // Check if password is hashed (bcrypt hashes start with $2)
            const isHashed = user.password.startsWith("$2");
            let isValid = false;

            if (isHashed) {
              // Password is hashed, use bcrypt compare
              isValid = await compare(credentials.password, user.password);
            } else {
              // Password is plain text, compare directly
              isValid = credentials.password === user.password;
            }

            if (!isValid) {
              return null;
            }

            code = user.code || "";
            // Return immediately after successful authentication for controllers
            return {
              id: user.wdt_ID.toString(),
              name: user.name ?? "",
              username: user.username ?? "",
              role,
              code: code,
              schoolId: user.schoolId, // Multi-tenant field
              schoolSlug: user.school?.slug, // For URL routing
            };
          } catch (error) {
            console.error("Controller authentication error:", error);
            return null;
          }
        }
        // Check registrals
        else if (role === "registral") {
          try {
            user = await prisma.wpos_wpdatatable_33.findFirst({
              where: { username: credentials.username },
              include: {
                school: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                  },
                },
              },
            });
            if (!user) {
              return null;
            }
            if (!user.password) {
              return null;
            }

            // Check if password is hashed (bcrypt hashes start with $2)
            const isHashed = user.password.startsWith("$2");
            let isValid = false;

            if (isHashed) {
              // Password is hashed, use bcrypt compare
              isValid = await compare(credentials.password, user.password);
            } else {
              // Password is plain text, compare directly
              isValid = credentials.password === user.password;
            }

            if (!isValid) {
              return null;
            }

            // Return immediately after successful authentication for registrals
            return {
              id: user.wdt_ID.toString(),
              name: user.name ?? "",
              username: user.username ?? "",
              role,
              schoolId: user.schoolId, // Multi-tenant field
              schoolSlug: user.school?.slug, // For URL routing
            };
          } catch (error) {
            console.error("Registral authentication error:", error);
            return null;
          }
        } else if (role === "teacher") {
          try {
            user = await prisma.wpos_wpdatatable_24.findFirst({
              where: { ustazid: credentials.username },
              include: {
                school: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                  },
                },
              },
            });
            if (!user) {
              return null;
            }
            if (!user.password) {
              return null;
            }

            // Check if password is hashed (bcrypt hashes start with $2)
            const isHashed = user.password.startsWith("$2");
            let isValid = false;

            if (isHashed) {
              // Password is hashed, use bcrypt compare
              isValid = await compare(credentials.password, user.password);
            } else {
              // Password is plain text, compare directly
              isValid = credentials.password === user.password;
            }

            if (!isValid) {
              return null;
            }

            return {
              id: user.ustazid,
              name: user.ustazname ?? "",
              username: user.ustazid ?? "",
              role,
              schoolId: user.schoolId, // Multi-tenant field
              schoolSlug: user.school?.slug, // For URL routing
            };
          } catch (error) {
            console.error("Teacher authentication error:", error);
            return null;
          }
        }
        // Check admins
        else if (role === "admin") {
          user = await prisma.admin.findFirst({
            where: { username: credentials.username },
            include: {
              school: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          });
        }

        // Handle super admin authentication separately
        if (role === "superAdmin") {
          try {
            console.log("Super admin authentication attempt:", {
              email: credentials.username,
              role,
            });

            // For super admin, we expect email in username field and password
            const email = credentials.username;
            const password = credentials.password;

            if (!email || !password) {
              console.log("Super admin auth failed: missing email or password");
              return null;
            }

            const superAdmin = await prisma.superAdmin.findUnique({
              where: { email },
            });

            console.log(
              "Super admin lookup result:",
              superAdmin ? "found" : "not found"
            );

            if (!superAdmin) {
              console.log("Super admin auth failed: user not found");
              return null;
            }

            if (!superAdmin.isActive) {
              console.log("Super admin auth failed: user not active");
              return null;
            }

            // Check if password is hashed (bcrypt hashes start with $2)
            const isHashed = superAdmin.password.startsWith("$2");
            let isValid = false;

            console.log("Password check - isHashed:", isHashed);

            if (isHashed) {
              // Password is hashed, use bcrypt compare
              isValid = await compare(password, superAdmin.password);
              console.log("Hashed password comparison result:", isValid);
            } else {
              // Password is plain text, compare directly
              isValid = password === superAdmin.password;
              console.log("Plain text password comparison result:", isValid);
            }

            if (!isValid) {
              console.log("Super admin auth failed: invalid password");
              return null;
            }

            console.log("Super admin auth successful");

            // Update last login
            await prisma.superAdmin.update({
              where: { id: superAdmin.id },
              data: { lastLogin: new Date() },
            });

            return {
              id: superAdmin.id,
              name: superAdmin.name,
              username: superAdmin.email, // Use email as username for super admin
              role: "superAdmin",
              schoolId: null, // Super admin has no school affiliation
              schoolSlug: null, // Super admin has no school slug
            };
          } catch (error) {
            console.error("Super admin authentication error:", error);
            return null;
          }
        }

        // Check admins
        if (role === "admin") {
          user = await prisma.admin.findFirst({
            where: { username: credentials.username },
            include: {
              school: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          });
        }

        if (!user) return null;

        // Add a type guard to check if user is an admin and has passcode
        if (user && "passcode" in user) {
          const isValid = await compare(credentials.password, user.passcode);
          if (!isValid) return null;
          // For admin, always use the integer id from the admin table
          const adminUser = user as any;
          return {
            id:
              adminUser.id !== undefined && adminUser.id !== null
                ? adminUser.id.toString()
                : "",
            name: adminUser.name ?? "",
            username: adminUser.username ?? "",
            role: adminUser.role ?? "admin",
            code: adminUser.code ?? "",
            schoolId: adminUser.schoolId, // Multi-tenant field (null for superAdmin/platform admins)
            schoolSlug: adminUser.school?.slug, // For URL routing
          };
        }

        // This should not be reached for controllers and registrals as they return early
        // Only admins and super admins should reach here, and they should have been handled above
        // Return null as fallback for any unexpected cases
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle redirects after login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.role = token.role as AuthUser["role"];
        session.user.code = token.code as string | undefined;
        session.user.schoolId = token.schoolId as string | null | undefined;
        session.user.schoolSlug = token.schoolSlug as string | undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
        token.code = user.code;
        token.schoolId = user.schoolId;
        token.schoolSlug = user.schoolSlug;
      }
      return token;
    },
  },
};

export async function getSessionUser(req: NextRequest) {
  // getServerSession in app router expects no args, so we use cookies from req
  // but in edge runtime, you may need to use headers/cookies directly
  // Here, we use getServerSession with authOptions
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  return session.user;
}
