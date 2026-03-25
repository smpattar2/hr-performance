import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH — submit peer feedback
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, comments, strengths, improvements, isAnonymous } = await req.json();

  const feedback = await prisma.peerFeedback.findUnique({ where: { id } });
  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  if (feedback.fromUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (feedback.status === "COMPLETED") {
    return NextResponse.json({ error: "Feedback already submitted" }, { status: 400 });
  }

  const updated = await prisma.peerFeedback.update({
    where: { id },
    data: {
      rating: parseFloat(rating),
      comments,
      strengths,
      improvements,
      isAnonymous: isAnonymous ?? true,
      status: "COMPLETED",
    },
  });

  return NextResponse.json(updated);
}
