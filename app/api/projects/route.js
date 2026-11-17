import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { projectCreateSchema } from "@/lib/validations/project";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ projects });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const parsed = projectCreateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid project details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const project = await prisma.project.create({ data: { name: parsed.data.name, description: parsed.data.description || null, userId: session.user.id } });
  return NextResponse.json({ project }, { status: 201 });
}
