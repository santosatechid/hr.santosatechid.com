import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, openAPI } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { sendMail } from "@/services/email/mailer";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Extra origins for local dev or extra hosts, comma separated.
  // PORT dev sering berbeda dari BETTER_AUTH_URL, dan BetterAuth menolak
  // sign-up/social kalau Origin tidak terdaftar (403). Origin lokal selalu
  // dimasukkan supaya dev tidak terkunci.
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    `http://localhost:${process.env.PORT ?? 3000}`,
    "http://localhost:3000",
    "http://localhost:2572",
  ],

  emailAndPassword: {
    enabled: true,
  },
  // Karyawan dibuat admin (email belum terverifikasi di tabel lokal). Google
  // membuktikan kepemilikan email, jadi login Google boleh menautkan akun itu.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60,
      strategy: "compact",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    openAPI(),
    // Login email-only: OTP 6 digit lewat email, sekaligus mendaftarkan akun
    // baru (disableSignUp tetap false) sebelum onboarding.
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp }) {
        await sendMail({
          to: email,
          subject: `Kode masuk Santosa HR: ${otp}`,
          text: `Kode masuk kamu ${otp}. Berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`,
        });
      },
    }),
    admin({
      // Optional: configure admin settings
      defaultRole: "user",
      adminRole: "admin",
      teacherRole: "teacher",
      studentRole: "student",
      parentRole: "parent",
    }),
    nextCookies(), // ✅ MOVED: Cookie plugin MUST be last
  ],
});
