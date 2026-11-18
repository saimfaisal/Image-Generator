import { prisma } from "@/lib/prisma";
import { projectCreateSchema } from "@/lib/validations/project";
import { jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    const response = jsonSuccess({ projects }, { requestId });
    logRequest(request, { requestId, scope: "projects.list", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "projects.list", status: response.status });
    return response;
  }
}

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const parsed = await parseBody(request, projectCreateSchema);
    const project = await prisma.project.create({ data: { name: parsed.name, description: parsed.description || null, userId: user.id } });
    const response = jsonSuccess({ project }, { requestId, status: 201 });
    logRequest(request, { requestId, scope: "projects.create", status: 201 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "projects.create", status: response.status });
    return response;
  }
}
