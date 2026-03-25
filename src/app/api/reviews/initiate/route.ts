import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reviewCycleId } = await req.json();

  // Get all non-admin users
  const employees = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    include: { reportsTo: true, department: true },
  });

  // Get departments with their founders
  const departments = await prisma.department.findMany({
    include: { founder: true },
  });

  const deptFounderMap = new Map(departments.map((d) => [d.id, d.founderId]));

  // Check existing reviews
  const existingReviews = await prisma.review.findMany({
    where: { reviewCycleId },
    select: { employeeId: true },
  });
  const existingSet = new Set(existingReviews.map((r) => r.employeeId));

  // Create reviews for employees without one
  const competencies = [
    "Goal Achievement",
    "Technical Skills",
    "Communication",
    "Leadership",
    "Initiative",
  ];

  let created = 0;
  for (const emp of employees) {
    if (existingSet.has(emp.id)) continue;

    const mgmtReviewerId = emp.departmentId
      ? deptFounderMap.get(emp.departmentId) ?? null
      : null;

    await prisma.review.create({
      data: {
        reviewCycleId,
        employeeId: emp.id,
        tlReviewerId: emp.reportsToId,
        mgmtReviewerId: mgmtReviewerId,
        status: "NOT_STARTED",
        competencies: {
          create: competencies.map((name) => ({
            competencyName: name,
          })),
        },
      },
    });
    created++;
  }

  // Notify all employees about the review
  try {
    for (const emp of employees) {
      if (existingSet.has(emp.id)) continue;
      await createNotification({
        userId: emp.id,
        type: "REVIEW_ASSIGNED",
        title: "Performance Review Initiated",
        message: "A new performance review cycle has started. Please complete your self-assessment.",
        link: "/reviews",
      });
    }
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ created, total: employees.length });
}
