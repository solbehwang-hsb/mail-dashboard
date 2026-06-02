import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomains = (process.env.ALLOWED_HOSTED_DOMAINS || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      if (allowedDomains.length === 0) return true;
      const domain = profile.email.split("@")[1];
      return allowedDomains.includes(domain);
    },
    async jwt({ token, account }) {
      // 로그인 시 access_token을 토큰에 저장
      if (account?.access_token) {
        token.access_token = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에 access_token 노출
      (session as { access_token?: string }).access_token = token.access_token as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
