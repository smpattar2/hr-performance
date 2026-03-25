"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TEAM_LEAD", "EMPLOYEE"] },
  { name: "OKRs", href: "/okrs", icon: Target, roles: ["ADMIN", "TEAM_LEAD", "EMPLOYEE"] },
  { name: "Reviews", href: "/reviews", icon: ClipboardCheck, roles: ["ADMIN", "TEAM_LEAD", "EMPLOYEE"] },
  { name: "Feedback", href: "/feedback", icon: MessageSquare, roles: ["ADMIN", "TEAM_LEAD", "EMPLOYEE"] },
  { name: "People", href: "/people", icon: Users, roles: ["ADMIN", "TEAM_LEAD"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as Record<string, unknown>)?.role as string ?? "EMPLOYEE";

  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Founder";
      case "TEAM_LEAD":
        return "Team Lead";
      default:
        return "Employee";
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-800 text-slate-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">PerfOS</h1>
          <p className="text-xs text-slate-400">Performance Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-slate-400")} />
              {item.name}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-400">
            {session?.user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-slate-400">{getRoleBadge(userRole)}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
