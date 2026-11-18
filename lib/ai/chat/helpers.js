export function toGeminiContents(messages) {
  return messages
    .filter((message) => message.role === "USER" || message.role === "ASSISTANT" || message.role === "SYSTEM")
    .map((message) => ({
      role: message.role === "ASSISTANT" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

export function getChunkText(chunk) {
  if (typeof chunk?.text === "string") return chunk.text;
  if (typeof chunk?.text === "function") return chunk.text();
  return chunk?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

export function getResponseText(response) {
  if (typeof response?.text === "string") return response.text;
  if (typeof response?.text === "function") return response.text();
  return response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}
