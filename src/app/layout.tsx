import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { CurrencyProvider } from "@/lib/CurrencyContext";

export const metadata: Metadata = {
  title: "Insider Tracker",
  description: "Personal insider trading tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen bg-gray-950 overflow-hidden md:flex-row">
        <CurrencyProvider>
          <AuthGuard>
            <Nav />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
              {children}
            </main>
          </AuthGuard>
        </CurrencyProvider>
      </body>
    </html>
  );
}
