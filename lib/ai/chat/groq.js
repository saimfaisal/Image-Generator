import Groq from "groq-sdk";
import { AiProviderError } from "@/lib/ai/errors";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AiProviderError("Groq is not configured.", {
      code: "GROQ_NOT_CONFIGURED",
      retryable: false,
    });
  }

  return new Groq({ apiKey, timeout: 30_000, maxRetries: 2 });
}

export const groqChatProvider = {
  id: "groq",
  model: () => process.env.GROQ_MODEL || DEFAULT_MODEL,

  async generate({ messages }) {
    try {
      return await getClient().chat.completions.create({
        model: this.model(),
        messages,
      });
    } catch (error) {
      throw new AiProviderError("Groq chat generation failed.", {
        code: "GROQ_CHAT_FAILED",
        cause: error,
      });
    }
  },

  async stream({ messages }) {
    try {
      return await getClient().chat.completions.create({
        model: this.model(),
        messages,
        stream: true,
      });
    } catch (error) {
      throw new AiProviderError("Groq chat stream failed.", {
        code: "GROQ_CHAT_STREAM_FAILED",
        cause: error,
      });
    }
  },
};

export function toGroqMessages(messages) {
  return messages
    .filter((message) => ["USER", "ASSISTANT", "SYSTEM"].includes(message.role))
    .map((message) => ({
      role: message.role === "ASSISTANT" ? "assistant" : message.role.toLowerCase(),
      content: message.content,
    }));
}

export function getGroqResponseText(response) {
  return response?.choices?.[0]?.message?.content || "";
}

export function getGroqChunkText(chunk) {
  return chunk?.choices?.[0]?.delta?.content || "";
}
