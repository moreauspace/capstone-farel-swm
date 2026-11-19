import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";
import { currentActor } from "@/lib/session";
import { getProjectDTO } from "@/server/queries";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const actor = await currentActor();
  const project = await getProjectDTO(params.id, actor);
  return { title: project?.code ?? "Proyek" };
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const actor = await currentActor();
  const project = await getProjectDTO(params.id, actor);
  if (!project) notFound();
  const canEdit = ["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role);
  return <ProjectWorkspace project={project} canEdit={canEdit} />;
}
