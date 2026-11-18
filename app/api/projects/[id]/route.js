import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validations/project";
import { jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser, requireOwnedProject } from "@/lib/auth/server";

export async function GET(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const project = await requireOwnedProject((await params).id, user.id);
    const response = jsonSuccess({ project }, { requestId });
    logRequest(request, { requestId, scope: "projects.get", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "projects.get", status: response.status });
    return response;
  }
}

export async function PATCH(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const id = (await params).id;
    await requireOwnedProject(id, user.id);
    const parsed = await parseBody(request, projectUpdateSchema);
    const project = await prisma.project.update({ where: { id }, data: parsed });
    const response = jsonSuccess({ project }, { requestId });
    logRequest(request, { requestId, scope: "projects.update", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "projects.update", status: response.status });
    return response;
  }
}

export async function DELETE(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const id = (await params).id;
    await requireOwnedProject(id, user.id);
    await prisma.project.delete({ where: { id } });
    const response = jsonSuccess({ deleted: true }, { requestId });
    logRequest(request, { requestId, scope: "projects.delete", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "projects.delete", status: response.status });
    return response;
  }
}
