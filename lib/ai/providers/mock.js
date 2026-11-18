import { AiProviderError } from "@/lib/ai/errors";

const dimensions = { "1:1": [1024, 1024], "16:9": [1536, 864], "9:16": [864, 1536], "4:3": [1365, 1024], "3:4": [1024, 1365] };

function escapeXml(value) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character])); }
function toDataUrl(svg) { return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`; }

export const mockImageProvider = {
  id: "mock",
  async generate({ prompt, aspectRatio, imageCount = 1 }) {
    if (!prompt.trim()) throw new AiProviderError("Prompt cannot be empty.", { code: "INVALID_PROMPT", retryable: false });
    const [width, height] = dimensions[aspectRatio] || dimensions["1:1"];
    return Array.from({ length: imageCount }, (_, index) => {
      const safePrompt = escapeXml(prompt.trim().slice(0, 180));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7c3aed"/><stop offset=".55" stop-color="#4f46e5"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${Math.round(width * .72)}" cy="${Math.round(height * .25)}" r="${Math.round(Math.min(width, height) * .18)}" fill="#ffffff" opacity=".18"/><text x="8%" y="78%" fill="white" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.round(Math.min(width, height) * .035))}" font-weight="600">Development mock ${index + 1}</text><text x="8%" y="84%" fill="white" opacity=".82" font-family="Arial, sans-serif" font-size="${Math.max(12, Math.round(Math.min(width, height) * .018))}">${safePrompt}</text></svg>`;
      return { dataUrl: toDataUrl(svg), mimeType: "image/svg+xml", width, height };
    });
  },
};
