import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "QuickCombo Rider Portal",
  description: "Delivery partner application for QuickCombo.",
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "82846188379-l5qb1pli9i7ofn6ti0in5nb8nonh2q4v.apps.googleusercontent.com";

  return (
    <html lang="en" className={jakarta.variable} data-scroll-behavior="smooth">
      <body className="bg-black text-white min-h-screen font-jakarta antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <main className="min-h-screen">{children}</main>
        </GoogleOAuthProvider>
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
