import { prisma } from "./db";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyReviewStatusChange(
  reviewId: string,
  employeeId: string,
  employeeName: string,
  newStatus: string,
  tlReviewerId?: string | null,
  mgmtReviewerId?: string | null
) {
  switch (newStatus) {
    case "SELF_REVIEW":
      // Notify TL that self-review is done
      if (tlReviewerId) {
        await createNotification({
          userId: tlReviewerId,
          type: "REVIEW_STATUS",
          title: "Self-Review Submitted",
          message: `${employeeName} has completed their self-assessment. Ready for your review.`,
          link: `/reviews/${reviewId}`,
        });
      }
      break;
    case "TL_REVIEW":
      // Notify management
      if (mgmtReviewerId) {
        await createNotification({
          userId: mgmtReviewerId,
          type: "REVIEW_STATUS",
          title: "TL Review Submitted",
          message: `Team Lead review for ${employeeName} is ready for management calibration.`,
          link: `/reviews/${reviewId}`,
        });
      }
      break;
    case "COMPLETED":
      // Notify employee
      await createNotification({
        userId: employeeId,
        type: "REVIEW_STATUS",
        title: "Review Completed",
        message: "Your performance review has been completed. View your final score.",
        link: `/reviews/${reviewId}`,
      });
      break;
  }
}
