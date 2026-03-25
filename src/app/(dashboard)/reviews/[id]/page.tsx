import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ReviewForm } from "./review-form";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const role = (session.user as Record<string, unknown>).role as string;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      tlReviewer: true,
      mgmtReviewer: true,
      reviewCycle: true,
      competencies: true,
    },
  });

  if (!review) notFound();

  return (
    <ReviewForm
      review={JSON.parse(JSON.stringify(review))}
      currentUserId={session.user.id}
      currentUserRole={role}
    />
  );
}
