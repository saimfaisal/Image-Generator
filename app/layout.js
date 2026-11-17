import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/SessionProvider";

export const metadata = {
  title: "PixelForge AI — Creative image tools",
  description: "A premium workspace for creating and refining visual ideas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning><AuthSessionProvider>{children}</AuthSessionProvider></body>
    </html>
  );
}
