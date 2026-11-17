import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validations/auth";

export async function POST(request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database is not configured. Add DATABASE_URL to .env.local and restart the dev server." }, { status: 503 });
    }
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid registration details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Unable to create account with those details." }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
