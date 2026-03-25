import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyReviewStatusChange } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, rating, comments, competencyScores } = await req.json();

  const review = await prisma.review.findUnique({
    where: { id },
    include: { competencies: true },
  });

  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update competency scores
  for (const [compId, score] of Object.entries(competencyScores)) {
    const updateData: Record<string, number> = {};
    if (type === "self") updateData.selfScore = score as number;
    if (type === "tl") updateData.tlScore = score as number;
    if (type === "mgmt") updateData.mgmtScore = score as number;

    await prisma.reviewCompetency.update({
      where: { id: compId },
      data: updateData,
    });
  }

  // Update review
  const updateData: Record<string, unknown> = {};

  if (type === "self") {
    updateData.selfRating = rating;
    updateData.selfComments = comments;
    updateData.status = "SELF_REVIEW";
  } else if (type === "tl") {
    updateData.tlRating = rating;
    updateData.tlComments = comments;
    updateData.status = "TL_REVIEW";
  } else if (type === "mgmt") {
    updateData.mgmtRating = rating;
    updateData.mgmtComments = comments;
    updateData.status = "COMPLETED";

    // Calculate final score: Self 20% + TL 40% + Mgmt 40%
    const selfRating = review.selfRating ?? 0;
    const tlRating = review.tlRating ?? 0;
    const mgmtRating = rating;
    updateData.finalScore = selfRating * 0.2 + tlRating * 0.4 + mgmtRating * 0.4;
  }

  const updated = await prisma.review.update({
    where: { id },
    data: updateData,
    include: { employee: { select: { name: true } } },
  });

  // Send notifications
  try {
    await notifyReviewStatusChange(
      id,
      review.employeeId,
      updated.employee.name,
      updated.status,
      review.tlReviewerId,
      review.mgmtReviewerId
    );
  } catch {
    // Non-blocking — don't fail the review submission
  }

  return NextResponse.json(updated);
}
