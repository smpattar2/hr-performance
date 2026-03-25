import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, name, year, quarter, startDate, endDate, status } = await req.json();

  if (!type || !name || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (type === "okr") {
    const cycle = await prisma.okrCycle.create({
      data: { name, quarter: quarter || 1, year: year || new Date().getFullYear(), startDate: new Date(startDate), endDate: new Date(endDate), status: status || "DRAFT" },
    });
    return NextResponse.json(cycle, { status: 201 });
  } else if (type === "review") {
    const cycle = await prisma.reviewCycle.create({
      data: { name, year: year || new Date().getFullYear(), startDate: new Date(startDate), endDate: new Date(endDate), status: status || "DRAFT" },
    });
    return NextResponse.json(cycle, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid cycle type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, id, status } = await req.json();

  if (type === "okr") {
    const cycle = await prisma.okrCycle.update({ where: { id }, data: { status } });
    return NextResponse.json(cycle);
  } else if (type === "review") {
    const cycle = await prisma.reviewCycle.update({ where: { id }, data: { status } });
    return NextResponse.json(cycle);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
