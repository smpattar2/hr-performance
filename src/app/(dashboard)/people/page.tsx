import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Users,
  Building2,
  Mail,
  ChevronDown,
  Crown,
  Shield,
  User,
} from "lucide-react";

export default async function PeoplePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  if (role === "EMPLOYEE") redirect("/dashboard");

  const [founders, departments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      include: {
        founder: true,
        members: {
          include: { reportsTo: true },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalEmployees = departments.reduce((sum, d) => sum + d.members.length, 0) + founders.length;

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case "ADMIN": return "bg-purple-50 text-purple-700 border-purple-200";
      case "TEAM_LEAD": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case "ADMIN": return "Founder";
      case "TEAM_LEAD": return "Team Lead";
      default: return "Employee";
    }
  };

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case "ADMIN": return <Crown className="w-3.5 h-3.5" />;
      case "TEAM_LEAD": return <Shield className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const getAvatarColor = (userRole: string) => {
    switch (userRole) {
      case "ADMIN": return "bg-purple-100 text-purple-600";
      case "TEAM_LEAD": return "bg-blue-100 text-blue-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">People & Organization</h1>
          <p className="text-slate-500 mt-1">
            {totalEmployees} team members across {departments.length} departments
          </p>
        </div>
      </div>

      {/* Org Tree - Founders at the top */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-purple-500" />
          Organization Hierarchy
        </h2>

        {/* Founders Row */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-4 bg-purple-50 rounded-xl p-4 border border-purple-200">
            {founders.map((f, idx) => (
              <div key={f.id} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor("ADMIN")} flex items-center justify-center text-sm font-bold`}>
                  {f.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-800">{f.name}</p>
                  <p className="text-xs text-purple-500">Founder</p>
                </div>
                {idx < founders.length - 1 && (
                  <div className="w-px h-8 bg-purple-200 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-slate-300" />
        </div>
        <div className="flex justify-center mb-2">
          <ChevronDown className="w-4 h-4 text-slate-400 -mt-1" />
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const teamLead = dept.members.find((m) => m.role === "TEAM_LEAD");
            const employees = dept.members.filter((m) => m.role === "EMPLOYEE");

            return (
              <div key={dept.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Department Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-bold text-slate-800">{dept.name}</h3>
                    </div>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
                      {dept.members.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-6">
                    Head: {dept.founder.name}
                  </p>
                </div>

                {/* Team Lead */}
                {teamLead && (
                  <div className="px-4 py-2.5 bg-blue-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${getAvatarColor("TEAM_LEAD")} flex items-center justify-center text-xs font-bold`}>
                        {teamLead.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{teamLead.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${getRoleBadge("TEAM_LEAD")}`}>
                            {getRoleIcon("TEAM_LEAD")}
                            {getRoleLabel("TEAM_LEAD")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employees */}
                <div className="divide-y divide-slate-50">
                  {employees.map((emp) => (
                    <div key={emp.id} className="px-4 py-2 flex items-center gap-2.5 hover:bg-slate-50">
                      <div className={`w-7 h-7 rounded-full ${getAvatarColor("EMPLOYEE")} flex items-center justify-center text-xs font-medium`}>
                        {emp.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail className="w-2.5 h-2.5" />
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="px-4 py-3 text-center text-xs text-slate-400">
                      No employees yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[11px] font-medium text-slate-700 truncate">{dept.name}</p>
            <p className="text-xl font-bold text-slate-800">{dept.members.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
