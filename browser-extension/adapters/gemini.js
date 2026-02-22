export function extractTranscript() {
    let transcript = "";
    const messages = [];

    // Gemini relies on semantic containers and listitem roles
    const turns = document.querySelectorAll(
        "user-query, model-response, message-content, [role='listitem'], [aria-label*='Message']"
    );

    if (turns.length === 0) {
        return {
            source: "gemini",
            transcript: "",
            messages: [],
            error: "Diagnostic error: Failed to extract transcript. Could not find semantic message containers via aria labels or role attributes."
        };
    }

    turns.forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

        // Identifying user messages via aria roles, tag names, or text alignment
        const isUser =
            tagName === "user-query" ||
            ariaLabel.includes("user") ||
            el.hasAttribute("data-user-message") ||
            (el.style && el.style.textAlign === "right");

        const role = isUser ? "user" : "assistant";
        const label = isUser ? "User" : "Assistant";
        const text = el.innerText?.trim() || el.textContent?.trim();

        if (text && !messages.find(m => m.content === text)) {
            transcript += `${label}: ${text}\n\n`;
            messages.push({ role, content: text });
        }
    });

    return {
        source: "gemini",
        transcript: transcript.trim(),
        messages
    };
}
