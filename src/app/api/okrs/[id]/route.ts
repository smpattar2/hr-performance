import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Update key result progress
  if (body.keyResultId && body.currentValue !== undefined) {
    const kr = await prisma.keyResult.findUnique({ where: { id: body.keyResultId } });
    if (!kr) return NextResponse.json({ error: "Key result not found" }, { status: 404 });

    const progress = Math.min(100, Math.round((body.currentValue / kr.targetValue) * 100));

    await prisma.keyResult.update({
      where: { id: body.keyResultId },
      data: { currentValue: body.currentValue, progress },
    });

    // Recalculate objective progress from all key results
    const allKRs = await prisma.keyResult.findMany({ where: { objectiveId: id } });
    const avgProgress = allKRs.reduce((sum, k) => {
      const p = k.id === body.keyResultId ? progress : k.progress;
      return sum + p;
    }, 0) / allKRs.length;

    // Auto-determine status
    let status = "ON_TRACK";
    if (avgProgress >= 100) status = "COMPLETED";
    else if (avgProgress < 30) status = "BEHIND";
    else if (avgProgress < 60) status = "AT_RISK";

    await prisma.objective.update({
      where: { id },
      data: { progress: avgProgress, status },
    });

    return NextResponse.json({ success: true, progress: avgProgress, status });
  }

  // Update objective details
  if (body.status) {
    await prisma.objective.update({
      where: { id },
      data: { status: body.status },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as Record<string, unknown>).role as string;

  if (role !== "ADMIN" && role !== "TEAM_LEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.objective.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
