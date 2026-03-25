import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { OkrDetail } from "./okr-detail";

export default async function OkrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const role = (session.user as Record<string, unknown>).role as string;

  const objective = await prisma.objective.findUnique({
    where: { id },
    include: {
      keyResults: { orderBy: { createdAt: "asc" } },
      owner: true,
      department: true,
      cycle: true,
      parentObjective: { select: { id: true, title: true, type: true } },
      childObjectives: {
        include: {
          keyResults: true,
          owner: true,
          childObjectives: {
            include: { keyResults: true, owner: true },
          },
        },
      },
    },
  });

  if (!objective) notFound();

  const canEdit =
    role === "ADMIN" ||
    objective.ownerId === session.user.id ||
    (role === "TEAM_LEAD" && objective.type !== "COMPANY");

  return (
    <OkrDetail
      objective={JSON.parse(JSON.stringify(objective))}
      canEdit={canEdit}
      userRole={role}
    />
  );
}
