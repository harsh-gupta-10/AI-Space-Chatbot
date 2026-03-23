"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Copy, Trash2, ChevronLeft, Pause, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";

interface Message {
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

export default function ChatInterface() {
    const initialMessage: Message = {
        role: "ai",
        content: "Greetings, Explorer. I am the NASA Ex-Scientist AI. How can I assist you with your journey through the cosmos today?",
        timestamp: new Date(),
    };

    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [input, setInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [streamPaused, setStreamPaused] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize speech recognition
        if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((result: any) => result[0].transcript)
                    .join("");
                setInput(transcript);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput(""); // Clear existing input when starting to listen
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage: Message = { role: "user", content: input, timestamp: new Date() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);
        setStreamPaused(false);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
            });

            if (!response.ok) throw new Error("Network response was not ok");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            readerRef.current = reader;
            const decoder = new TextDecoder("utf-8");

            setMessages((prev) => [...prev, { role: "ai", content: "", timestamp: new Date() }]);

            let done = false;
            while (!done) {
                if (streamPaused) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }

                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage.role === "ai") {
                            lastMessage.content += chunk;
                        }
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Error communicating with AI:", error);
            setMessages((prev) => [
                ...prev,
                { role: "ai", content: "Error: Comm-link disconnected. Please try again.", timestamp: new Date() },
            ]);
        } finally {
            setIsTyping(false);
            readerRef.current = null;
        }
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setCopyFeedback(true);
            setTimeout(() => {
                setCopiedIdx(null);
                setCopyFeedback(false);
            }, 2000);
        });
    };

    const clearConversation = () => {
        if (confirm("Clear all messages? This cannot be undone.")) {
            setMessages([initialMessage]);
        }
    };

    
    const toggleStreamPause = () => {
        setStreamPaused(!streamPaused);
    };

    const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).length * 1.3);

    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    return (
        <div className="flex h-[600px] max-h-[80vh] bg-black/50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Sidebar - Conversation History */}
            <div
                className={`${
                    sidebarOpen ? "w-56" : "w-0"
                } bg-black/60 border-r border-white/10 overflow-y-auto transition-all duration-300 ease-out flex flex-col`}
            >
                {sidebarOpen && (
                    <div className="p-4 space-y-3">
                        <h3 className="text-white/70 text-xs font-semibold uppercase">History</h3>
                        {messages.filter(m => m.role === "user").map((msg, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="text-left text-xs text-zinc-400 hover:text-white p-2 bg-white/5 rounded hover:bg-white/10 transition-all truncate"
                                title={msg.content}
                            >
                                {msg.content.substring(0, 40)}...
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className={`text-zinc-400 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <span className="text-xl">🚀</span>
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">NASA Expert AI</h2>
                            <p className="text-blue-300 text-xs flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Systems Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearConversation}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                        title="Clear conversation"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed group relative ${
                                    msg.role === "user"
                                        ? "bg-blue-600/90 text-white rounded-br-sm shadow-lg shadow-blue-900/20"
                                        : "bg-white/5 text-zinc-200 border border-white/10 rounded-bl-sm backdrop-blur-sm"
                                }`}
                            >
                                {msg.role === "ai" && (
                                    <button
                                        onClick={() => copyToClipboard(msg.content, idx)}
                                        className="absolute -right-10 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded-lg"
                                        title="Copy response"
                                    >
                                        <Copy size={16} className={copiedIdx === idx ? "text-green-400" : "text-white/60"} />
                                    </button>
                                )}
                                {msg.role === "ai" ? (
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 mt-[-1em] mb-[-1em]">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                                <div className="text-xs mt-2 opacity-60">
                                    {formatDistanceToNow(msg.timestamp, { addSuffix: false })} ago
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && messages[messages.length - 1]?.role !== "ai" && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 backdrop-blur-sm flex gap-1 items-center h-10 text-zinc-400 text-xs">
                                <span className="animate-pulse">●</span>
                                <span className="animate-pulse delay-100">●</span>
                                <span className="animate-pulse delay-200">●</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Session Stats Footer */}
                {messages.length > 1 && (
                    <div className="px-6 py-3 bg-black/40 border-y border-white/5 flex justify-between text-xs text-zinc-400">
                        <span>Messages: {messages.length}</span>
                        <span>≈ {totalTokens} tokens</span>
                        <span>Model: gemini-2.5-flash</span>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/5">
                    <form onSubmit={handleSubmit} className="flex gap-2 relative">
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-3 rounded-xl transition-all ${
                                isListening
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse border border-red-500/30"
                                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-transparent"
                            }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            <Mic size={20} />
                        </button>
                        {isTyping && (
                            <button
                                type="button"
                                onClick={toggleStreamPause}
                                className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-all"
                                title={streamPaused ? "Resume" : "Pause"}
                            >
                                {streamPaused ? <Play size={20} /> : <Pause size={20} />}
                            </button>
                        )}
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isListening}
                            placeholder={isListening ? "Listening..." : "Ask the NASA module..."}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping || isListening}
                            className="p-3 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toast Notification */}
            {copyFeedback && (
                <div className="fixed bottom-20 right-8 bg-green-500/90 text-white px-4 py-2 rounded-lg text-sm pointer-events-none animate-pulse">
                    Copied to clipboard!
                </div>
            )}
        </div>
    );
}
