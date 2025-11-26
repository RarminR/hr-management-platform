"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  // Don't show sidebar on login page
  const isAuthPage = pathname?.startsWith("/auth");
  
  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Only show dashboard layout for authenticated users and non-auth pages
  if (status === "authenticated" && !isAuthPage) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // For unauthenticated users or auth pages, render content without sidebar
  return <>{children}</>;
}