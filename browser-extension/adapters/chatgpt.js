export function extractTranscript() {
    let transcript = "";
    const messages = [];

    const nodes = document.querySelectorAll("[data-message-author-role]");

    nodes.forEach((el) => {
        const role = el.getAttribute("data-message-author-role");
        const label = role === "user" ? "User" : "Assistant";
        const text = el.innerText?.trim();
        if (text) {
            transcript += `${label}: ${text}\n\n`;
            messages.push({ role, content: text });
        }
    });

    return {
        source: "chatgpt",
        transcript: transcript.trim(),
        messages
    };
}
