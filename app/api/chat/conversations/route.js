import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser, requireOwnedProject } from "@/lib/auth/server";
import { conversationCreateSchema, paginationSchema } from "@/lib/validations/chat";

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const url = new URL(request.url);
    const { page, limit } = paginationSchema.parse({ page: url.searchParams.get("page") || 1, limit: url.searchParams.get("limit") || 20 });
    const where = { userId: user.id };
    const [conversations, total] = await prisma.$transaction([
      prisma.conversation.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { _count: { select: { messages: true } } } }),
      prisma.conversation.count({ where }),
    ]);
    const response = jsonSuccess({ conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.list", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.list", status: response.status });
    return response;
  }
}

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const parsed = await parseBody(request, conversationCreateSchema);
    if (parsed.projectId) await requireOwnedProject(parsed.projectId, user.id);
    const conversation = await prisma.conversation.create({ data: { userId: user.id, projectId: parsed.projectId || null, title: parsed.title || null } });
    const response = jsonSuccess({ conversation }, { requestId, status: 201 });
    logRequest(request, { requestId, scope: "chat.conversations.create", status: 201 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.create", status: response.status });
    return response;
  }
}
