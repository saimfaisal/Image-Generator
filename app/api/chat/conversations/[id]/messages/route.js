import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { AiProviderError } from "@/lib/ai/errors";
import { googleChatProvider } from "@/lib/ai/chat/google";
import { chatMessageSchema } from "@/lib/validations/chat";
import { getChunkText, getResponseText, toGeminiContents } from "@/lib/ai/chat/helpers";

async function getConversation(id, userId) {
  const conversation = await prisma.conversation.findFirst({ where: { id, userId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } } });
  if (!conversation) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
  return conversation;
}

function safeProviderError(error) {
  return error instanceof AiProviderError ? new ApiError(502, error.code, "Chat service is temporarily unavailable.") : error;
}

async function createUserMessage(conversationId, content) {
  return prisma.message.create({ data: { conversationId, role: "USER", status: "COMPLETED", content } });
}

export async function POST(request, { params }) {
  const requestId = getRequestId(request);
  let userMessage;
  let conversation;
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 200_000) throw new ApiError(413, "REQUEST_TOO_LARGE", "Chat message request is too large.");
    const user = await requireAuthenticatedUser();
    const rate = await checkRateLimit({ request, scope: "chat.message", userId: user.id, limit: 30, windowMs: 60 * 60_000 });
    if (rate.unavailable) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Chat service is temporarily unavailable.");
    if (!rate.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many chat requests. Please try again later.");
    conversation = await getConversation((await params).id, user.id);
    const parsed = await parseBody(request, chatMessageSchema);
    userMessage = await createUserMessage(conversation.id, parsed.content);
    const contents = toGeminiContents([...conversation.messages, userMessage]);

    if (parsed.stream) {
      const stream = await googleChatProvider.stream({ contents });
      const encoder = new TextEncoder();
      let assistantText = "";
      const body = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = getChunkText(chunk);
              if (!text) continue;
              assistantText += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            if (!assistantText) throw new Error("EMPTY_PROVIDER_RESPONSE");
            await prisma.message.create({ data: { conversationId: conversation.id, role: "ASSISTANT", status: "COMPLETED", content: assistantText, provider: googleChatProvider.id, model: googleChatProvider.model() } });
            await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            await prisma.message.delete({ where: { id: userMessage.id } }).catch(() => undefined);
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Chat service is temporarily unavailable.", requestId })}\n\n`));
            controller.close();
          }
        },
      });
      return new Response(body, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive", "x-request-id": requestId } });
    }

    const providerResponse = await googleChatProvider.generate({ contents });
    const assistantText = getResponseText(providerResponse);
    if (!assistantText) throw new AiProviderError("Chat provider returned an empty response.", { code: "GOOGLE_CHAT_EMPTY_RESPONSE", retryable: true });
    const assistant = await prisma.message.create({ data: { conversationId: conversation.id, role: "ASSISTANT", status: "COMPLETED", content: assistantText, provider: googleChatProvider.id, model: googleChatProvider.model() } });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    const response = jsonSuccess({ message: assistant }, { requestId, status: 201 });
    logRequest(request, { requestId, scope: "chat.message.create", status: 201 });
    return response;
  } catch (error) {
    if (userMessage?.id) await prisma.message.delete({ where: { id: userMessage.id } }).catch(() => undefined);
    const response = jsonError(safeProviderError(error), { requestId });
    logRequest(request, { requestId, scope: "chat.message.create", status: response.status });
    return response;
  }
}
