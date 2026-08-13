import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import SideNav from "@/components/layout/SideNav";
import ContentFrame from "@/components/layout/ContentFrame";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthGate } from "@/components/providers/AuthGate";
import { I18nProvider } from "@/components/providers/I18nProvider";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FloodWise — Marikina & Nearby Cities Flood Intelligence",
  description:
    "Report what you safely see. Know what you can trust. Take the safer route.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  // Allow zoom for accessibility; cover safe areas (notches/rounded corners).
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {/* Responsive shell: sidebar on desktop, bottom bar on mobile */}
              <div className="flex min-h-screen bg-surface-bg">
                <SideNav />
                <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                  <ContentFrame>
                    <AuthGate>{children}</AuthGate>
                  </ContentFrame>
                </main>
              </div>
              <BottomNav />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
