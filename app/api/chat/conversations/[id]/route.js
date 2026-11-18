import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";

async function getOwnedConversation(id, userId) {
  const conversation = await prisma.conversation.findFirst({ where: { id, userId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } } });
  if (!conversation) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
  return conversation;
}

export async function GET(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const conversation = await getOwnedConversation((await params).id, user.id);
    const response = jsonSuccess({ conversation }, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.get", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.get", status: response.status });
    return response;
  }
}

export async function DELETE(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const conversation = await getOwnedConversation((await params).id, user.id);
    await prisma.conversation.delete({ where: { id: conversation.id } });
    const response = jsonSuccess({ deleted: true }, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.delete", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "chat.conversations.delete", status: response.status });
    return response;
  }
}
