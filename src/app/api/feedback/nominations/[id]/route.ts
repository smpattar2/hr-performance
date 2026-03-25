import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH — approve or reject a nomination (TL/Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN" && role !== "TEAM_LEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const nomination = await prisma.peerNomination.update({
    where: { id },
    data: { status, approvedById: session.user.id },
    include: {
      employee: { select: { id: true, name: true } },
      peer: { select: { id: true, name: true } },
    },
  });

  // If approved, create a peer feedback record for the nominated peer
  if (status === "APPROVED") {
    const existingFeedback = await prisma.peerFeedback.findFirst({
      where: {
        reviewCycleId: nomination.reviewCycleId,
        fromUserId: nomination.peerId,
        toUserId: nomination.employeeId,
      },
    });

    if (!existingFeedback) {
      await prisma.peerFeedback.create({
        data: {
          reviewCycleId: nomination.reviewCycleId,
          fromUserId: nomination.peerId,
          toUserId: nomination.employeeId,
          isAnonymous: true,
          status: "PENDING",
        },
      });
    }
  }

  return NextResponse.json(nomination);
}

// DELETE — remove a nomination (only the employee or admin)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as Record<string, unknown>).role as string;

  const nomination = await prisma.peerNomination.findUnique({ where: { id } });
  if (!nomination) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (nomination.employeeId !== session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (nomination.status === "APPROVED") {
    return NextResponse.json({ error: "Cannot remove approved nomination" }, { status: 400 });
  }

  await prisma.peerNomination.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
