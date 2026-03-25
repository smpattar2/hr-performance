import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { FeedbackForm } from "./feedback-form";

export default async function SubmitFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const feedback = await prisma.peerFeedback.findUnique({
    where: { id },
    include: {
      toUser: { select: { id: true, name: true, email: true } },
      reviewCycle: { select: { id: true, name: true } },
    },
  });

  if (!feedback) notFound();

  if (feedback.fromUserId !== session.user.id) {
    redirect("/feedback");
  }

  if (feedback.status === "COMPLETED") {
    redirect("/feedback");
  }

  return (
    <FeedbackForm
      feedbackId={feedback.id}
      recipientName={feedback.toUser.name}
      cycleName={feedback.reviewCycle.name}
    />
  );
}
