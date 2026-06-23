import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "TurfBook — Book Premium Sports Turfs",
    template: "%s | TurfBook",
  },
  description:
    "Find and book the best sports turfs near you. Instant confirmation, transparent pricing, and a seamless booking experience.",
  keywords: ["turf booking", "sports booking", "cricket", "football turf", "badminton court"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background">
        <AuthProvider>
          {children}
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
