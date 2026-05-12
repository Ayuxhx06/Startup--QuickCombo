import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import StickyCart from "@/components/StickyCart";
import FloatingTracker from "@/components/FloatingTracker";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "QuickCombo — Fast Food + Essentials Delivery",
  description: "Order food, beverages & daily essentials in minutes. Premium combos delivered to your door.",
  keywords: "food delivery, quick delivery, combo meals, beverages, essentials",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "QuickCombo",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "QuickCombo — Fast Food + Essentials Delivery",
    description: "Order food, beverages & daily essentials in minutes.",
    type: "website",
  },
  verification: {
    google: "ag-ZSpsaO3zuR22HjuBDPIdaFS_CPHDRe1ZAi3f8i-w",
  },
};

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "732009088656-32g92jcl20iubm821262d1u5053n96m2.apps.googleusercontent.com"; // Placeholder

  return (
    <html lang="en" className={jakarta.variable} data-scroll-behavior="smooth">
      <body className="bg-black text-white min-h-screen font-jakarta antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <MaintenanceGuard>
                <main className="pb-20 min-h-screen">{children}</main>
              </MaintenanceGuard>
              <BottomNav />
              <StickyCart />
              <FloatingTracker />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: '#111',
                    color: '#fff',
                    border: '1px solid #22c55e33',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-jakarta)',
                  },
                  success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
