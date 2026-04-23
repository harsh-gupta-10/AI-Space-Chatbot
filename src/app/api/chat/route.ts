import OpenAI from "openai";
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
5. Use space analogies when appropriate, but keep explanations clear.`;

type ChatMessage = {
    role: string;
    content: string;
};

function sanitizeHistory(messages: ChatMessage[]) {
    const firstUserIndex = messages.findIndex((message) => message.role === "user");

    if (firstUserIndex === -1) {
        return [];
    }

    return messages.slice(firstUserIndex).filter((message) => message.role === "user" || message.role === "ai" || message.role === "assistant");
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.NEXT_HACKCLUB_API_KEY || process.env.HACKCLUB_API_KEY;
        
        if (!apiKey || apiKey === "your_hack_club_api_key_here") {
            return new Response("API key not configured. Please add HACKCLUB_API_KEY to your .env.local file.", { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://ai.hackclub.com/proxy/v1",
        });

        const { messages } = await req.json();
        const conversation = sanitizeHistory(Array.isArray(messages) ? messages : []);

        if (conversation.length === 0) {
            return new Response("No user message provided", { status: 400 });
        }

        const openaiMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversation.map((message: ChatMessage) => ({
                role: message.role === "ai" ? "assistant" : message.role,
                content: message.content,
            })),
        ];

        const response = await openai.chat.completions.create({
            model: "qwen/qwen-2-5-72b-instruct",
            messages: openaiMessages as any,
            stream: true,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("Stream Error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ 
            error: error.message || String(error),
            details: "Ensure your Hack Club API key is valid and you have access to the model."
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
