import { extractTranscript as extractChatGPT } from "./chatgpt.js";
import { extractTranscript as extractClaude } from "./claude.js";
import { extractTranscript as extractGemini } from "./gemini.js";

export function getAdapter(hostname) {
    if (hostname.includes("openai.com") || hostname.includes("chatgpt.com")) {
        return { extractTranscript: extractChatGPT };
    }
    if (hostname.includes("claude.ai")) {
        return { extractTranscript: extractClaude };
    }
    if (hostname.includes("gemini.google.com") || hostname.includes("bard.google.com")) {
        return { extractTranscript: extractGemini };
    }
    return null;
}
