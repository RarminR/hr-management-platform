'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  GraduationCap,
  Shield,
  Heart,
  Package,
  AlertTriangle,
  Award,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ClipboardList,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    color: 'text-blue-600',
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    color: 'text-green-600',
  },
  {
    name: 'Departments',
    href: '/departments',
    icon: Building2,
    color: 'text-purple-600',
  },
  {
    name: 'Studies & Training',
    href: '/studies',
    icon: GraduationCap,
    color: 'text-indigo-600',
  },
  {
    name: 'Authorizations',
    href: '/authorizations',
    icon: Shield,
    color: 'text-yellow-600',
  },
  {
    name: 'Health & Medical',
    href: '/health',
    icon: Heart,
    color: 'text-red-600',
  },
  {
    name: 'Assets & Equipment',
    href: '/assets',
    icon: Package,
    color: 'text-orange-600',
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: Award,
    color: 'text-emerald-600',
  },
  {
    name: 'Warnings',
    href: '/warnings',
    icon: AlertTriangle,
    color: 'text-rose-600',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    color: 'text-cyan-600',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    color: 'text-pink-600',
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
    color: 'text-teal-600',
  },
];

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    color: 'text-gray-600',
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: Activity,
    color: 'text-gray-600',
    adminOnly: true,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-900 text-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className={cn(
          "flex items-center space-x-3 transition-opacity",
          collapsed && "opacity-0"
        )}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">HR Platform</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {user && (
        <div className={cn(
          "p-4 border-b border-gray-800",
          collapsed && "px-2"
        )}>
          <div className={cn(
            "flex items-center space-x-3",
            collapsed && "justify-center"
          )}>
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.role.toUpperCase()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0 h-5 w-5",
                isActive ? item.color : "text-gray-400",
                !collapsed && "mr-3"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-4 border-t border-gray-800 space-y-1">
        {bottomNavigation.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0 h-5 w-5",
                item.color,
                !collapsed && "mr-3"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
        
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className={cn(
              "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-gray-300 hover:bg-gray-800 hover:text-white",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className={cn(
              "flex-shrink-0 h-5 w-5 text-gray-400",
              !collapsed && "mr-3"
            )} />
            {!collapsed && (
              <span className="truncate">Sign Out</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}