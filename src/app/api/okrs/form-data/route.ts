import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [cycles, departments, parentObjectives] = await Promise.all([
    prisma.okrCycle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.objective.findMany({
      where: { type: { in: ["COMPANY", "DEPARTMENT"] } },
      select: { id: true, title: true, type: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ cycles, departments, parentObjectives });
}
