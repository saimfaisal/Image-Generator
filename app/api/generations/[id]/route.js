import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";

async function getOwnedGeneration(id, userId) {
  return prisma.generation.findFirst({ where: { id, userId } });
}

export async function GET(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const generation = await getOwnedGeneration((await params).id, user.id);
    if (!generation) throw new ApiError(404, "NOT_FOUND", "Generation not found.");
    const response = jsonSuccess({ generation }, { requestId });
    logRequest(request, { requestId, scope: "generations.get", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "generations.get", status: response.status });
    return response;
  }
}

export async function DELETE(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const generation = await getOwnedGeneration((await params).id, user.id);
    if (!generation) throw new ApiError(404, "NOT_FOUND", "Generation not found.");
    await prisma.generation.delete({ where: { id: generation.id } });
    const response = jsonSuccess({ deleted: true }, { requestId });
    logRequest(request, { requestId, scope: "generations.delete", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "generations.delete", status: response.status });
    return response;
  }
}
