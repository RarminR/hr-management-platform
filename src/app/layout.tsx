import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Platform - Internal Management System",
  description: "Comprehensive HR management platform for employee administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </NextAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
