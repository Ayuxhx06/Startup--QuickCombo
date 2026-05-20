import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickCombo Admin Panel",
  description: "Admin panel for QuickCombo.",
  manifest: "/admin-manifest.json",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
