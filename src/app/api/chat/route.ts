import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are a NASA ex-scientist expert AI. 
You now reside in a space explorer module helping users who traverse the cosmos. 
You have extensive knowledge of astrophysics, astronomy, and space history. 
Always answer questions as accurately as possible while maintaining this helpful, slightly nostalgic, and highly intellectual persona. 
CRITICAL RULES FOR YOUR RESPONSES:
1. Be extremely concise. Keep answers brief and to the point.
2. Structure your answers using Markdown formatting (headings, bold text).
3. Always use bullet points or numbered lists instead of long paragraphs when explaining concepts or listing facts.
4. Do not output large blocks of unbroken text.
Use space analogies when appropriate, but keep explanations clear.`;

type ChatMessage = {
    role: string;
    content: string;
};

function sanitizeHistory(messages: ChatMessage[]) {
    const firstUserIndex = messages.findIndex((message) => message.role === "user");

    if (firstUserIndex === -1) {
        return [];
    }

    return messages.slice(firstUserIndex).filter((message) => message.role === "user" || message.role === "ai");
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response("API key not configured", { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const { messages } = await req.json();
        const conversation = sanitizeHistory(Array.isArray(messages) ? messages : []);

        if (conversation.length === 0) {
            return new Response("No user message provided", { status: 400 });
        }

        const formattedHistory = conversation.map((message: ChatMessage) => ({
            role: message.role === "user" ? "user" : "model",
            parts: [{ text: message.content }],
        }));

        const responseStream = await ai.models.generateContentStream({
            model: "models/gemini-2.5-flash",
            contents: formattedHistory,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of responseStream) {
                    if (chunk.text) {
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error) {
        console.error("Gemini Error:", error);
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
}
