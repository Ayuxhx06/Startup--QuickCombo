import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "QuickCombo Admin Dashboard",
  description: "Administrative control center for managing orders, partners, items, and platform settings.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} data-scroll-behavior="smooth">
      <body className="bg-black text-white min-h-screen font-jakarta antialiased">
        <main className="min-h-screen">{children}</main>
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
      </body>
    </html>
  );
}
