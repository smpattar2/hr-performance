import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET — list nominations for the current user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id;

  // Admins and TLs see all nominations, employees see only their own
  const nominations = await prisma.peerNomination.findMany({
    where:
      role === "ADMIN"
        ? {}
        : role === "TEAM_LEAD"
        ? {
            OR: [
              { employeeId: userId },
              { employee: { reportsToId: userId } },
            ],
          }
        : { employeeId: userId },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      peer: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      reviewCycle: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(nominations);
}

// POST — create a new peer nomination
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reviewCycleId, peerId } = await req.json();
  const userId = session.user.id;

  if (!reviewCycleId || !peerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (peerId === userId) {
    return NextResponse.json({ error: "Cannot nominate yourself" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await prisma.peerNomination.findFirst({
    where: { reviewCycleId, employeeId: userId, peerId },
  });
  if (existing) {
    return NextResponse.json({ error: "Nomination already exists" }, { status: 400 });
  }

  // Check nomination limit (max 5)
  const count = await prisma.peerNomination.count({
    where: { reviewCycleId, employeeId: userId },
  });
  if (count >= 5) {
    return NextResponse.json({ error: "Maximum 5 nominations allowed" }, { status: 400 });
  }

  const nomination = await prisma.peerNomination.create({
    data: { reviewCycleId, employeeId: userId, peerId },
    include: {
      peer: { select: { id: true, name: true, email: true } },
      reviewCycle: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(nomination, { status: 201 });
}
