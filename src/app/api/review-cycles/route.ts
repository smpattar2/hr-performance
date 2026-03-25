import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cycles = await prisma.reviewCycle.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, status: true, year: true },
  });

  return NextResponse.json({ cycles });
}
