export function extractTranscript() {
    let transcript = "";
    const messages = [];

    // Strategy: Look for generic semantic containers or aria roles. 
    // We avoid hardcoded classes or test ids.
    const turns = document.querySelectorAll(
        "article, [role='article'], [role='presentation'], [data-is-user], fieldset"
    );

    if (turns.length > 0) {
        turns.forEach((el) => {
            // Identifying user messages via text alignment or aria roles/attributes
            const isUser =
                el.getAttribute("data-is-user") === "true" ||
                el.hasAttribute("data-user") ||
                (el.getAttribute("aria-label") || "").toLowerCase().includes("user") ||
                (el.style && el.style.textAlign === "right");

            const role = isUser ? "user" : "assistant";
            const label = isUser ? "User" : "Assistant";
            const text = el.innerText?.trim();

            // Avoid duplicate captures if layout nests semantic blocks
            if (text && !messages.find(m => m.content === text)) {
                transcript += `${label}: ${text}\n\n`;
                messages.push({ role, content: text });
            }
        });
    }

    return {
        source: "claude",
        transcript: transcript.trim(),
        messages
    };
}
