import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validations/project";

async function getOwnedProject(id, userId) { return prisma.project.findFirst({ where: { id, userId } }); }

export async function GET(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const project = await getOwnedProject((await params).id, session.user.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const id = (await params).id;
  if (!await getOwnedProject(id, session.user.id)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const parsed = projectUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid project details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const project = await prisma.project.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ project });
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const id = (await params).id;
  if (!await getOwnedProject(id, session.user.id)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  await prisma.project.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
