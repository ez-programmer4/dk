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
  role: "teacher" | "admin" | "controller" | "registral" | "superAdmin";
  code?: string;
  schoolId?: string;
  schoolSlug?: string;
  schoolName?: string;
};

export const authOptions: NextAuthOptions = {
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
            };
          } catch (error) {
            console.error("Registral authentication error:", error);
            return null;
          }
        } else if (role === "teacher") {
          try {
            user = await prisma.wpos_wpdatatable_24.findFirst({
              where: { ustazid: credentials.username },
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
            };
          } catch (error) {
            console.error("Teacher authentication error:", error);
            return null;
          }
        }
        // Check super admins first (separate table)
        else if (role === "superAdmin") {
          user = await prisma.superAdmin.findFirst({
            where: { email: credentials.username }, // For superAdmin, username field contains email
          });

          if (!user) return null;

          // Check if password is hashed (bcrypt hashes start with $2)
          const isHashed = user.password.startsWith("$2");
          let isValid = false;

          if (isHashed) {
            // Password is hashed, use bcrypt compare
            isValid = await compare(credentials.password, user.password);
          } else {
            // Password is plain text, compare directly (fallback for legacy)
            isValid = credentials.password === user.password;
          }

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name ?? "",
            username: user.email ?? "", // Use email as username for superAdmin
            role: "superAdmin",
          };
        }
        // Check regular admins
        else if (role === "admin") {
          user = await prisma.admin.findFirst({
            where: { username: credentials.username },
          });

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
            };
          }
        }

        // This should not be reached for controllers and registrals as they return early
        // Only admins should reach here, and they should have been handled above
        // Return null as fallback for any unexpected cases
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.code = token.code as string | undefined;

        // Include school information in session
        if (token.schoolId) {
          session.user.schoolId = token.schoolId as string;
        }
        if (token.schoolSlug) {
          session.user.schoolSlug = token.schoolSlug as string;
        }
        if (token.schoolName) {
          session.user.schoolName = token.schoolName as string;
        }
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

        // Fetch and set school information for multi-tenant support
        try {
          let schoolInfo = null;

          if (user.role === 'admin') {
            // Fetch admin with school info
            if (user.id && user.id.trim() !== '') {
              const admin = await prisma.admin.findUnique({
                where: { id: user.id },
                include: { school: true }
              });
              if (admin?.school) {
                schoolInfo = {
                  schoolId: admin.school.id,
                  schoolSlug: admin.school.slug,
                  schoolName: admin.school.name
                };
              }
            }
          } else if (user.role === 'teacher') {
            // Fetch teacher with school info
            const teacher = await prisma.wpos_wpdatatable_24.findUnique({
              where: { ustazid: user.id },
              include: { school: true }
            });
            if (teacher?.school) {
              schoolInfo = {
                schoolId: teacher.school.id,
                schoolSlug: teacher.school.slug,
                schoolName: teacher.school.name
              };
            }
          } else if (user.role === 'controller') {
            // Fetch controller with school info
            const controller = await prisma.wpos_wpdatatable_28.findUnique({
              where: { wdt_ID: parseInt(user.id) },
              include: { school: true }
            });
            if (controller?.school) {
              schoolInfo = {
                schoolId: controller.school.id,
                schoolSlug: controller.school.slug,
                schoolName: controller.school.name
              };
            }
          } else if (user.role === 'registral') {
            // Fetch registral with school info
            const registral = await prisma.wpos_wpdatatable_33.findUnique({
              where: { wdt_ID: parseInt(user.id) },
              include: { school: true }
            });
            if (registral?.school) {
              schoolInfo = {
                schoolId: registral.school.id,
                schoolSlug: registral.school.slug,
                schoolName: registral.school.name
              };
            }
          }

          // Set school information in token
          if (schoolInfo) {
            token.schoolId = schoolInfo.schoolId;
            token.schoolSlug = schoolInfo.schoolSlug;
            token.schoolName = schoolInfo.schoolName;
          } else if (user.role === 'superAdmin') {
            // Super admins don't have a specific school, they can access all schools
            // Set a flag to indicate global access
            token.schoolId = null;
            token.schoolSlug = null;
            token.schoolName = null;
            token.hasGlobalAccess = true;
          }
        } catch (error) {
          console.error('Error fetching school info for JWT:', error);
          // Don't fail authentication, just log the error
        }
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
