import Credentials from "next-auth/providers/credentials";

const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({ credentials: { email: {}, password: {} } })],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = user.id; token.role = user.role; } return token; },
    async session({ session, token }) { if (session.user) { session.user.id = token.id; session.user.role = token.role; } return session; },
  },
};

export default authConfig;
