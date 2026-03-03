import React, { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Message {
    id: string;
    sender: "user" | "agent";
    content: string;
    timestamp: Date;
}

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "greeting",
            sender: "agent",
            content: `Hi ${user?.full_name.split(' ')[0]}! I'm your CareBank AI assistant. I can help you with transactions, balance inquiries, financial advice, or understanding your spending. How can I assist you today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await api.post("/api/chat", {
                message: userMessage.content,
                user_id: user?.user_id,
                thread_id: user?.user_id || "default"
            });

            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "agent",
                content: response.data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, agentMessage]);
        } catch (err) {
            console.error("Chat error", err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "agent",
                content: "I'm sorry, I'm having trouble connecting to the network right now. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex justify-center items-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">CareBank Assistant</h2>
                    <p className="text-xs text-slate-500 font-medium">Powered by AI Agents</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start space-x-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                            }`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-slate-200' : 'bg-blue-100'
                            }`}>
                            {msg.sender === 'user' ? (
                                <UserIcon className="w-4 h-4 text-slate-600" />
                            ) : (
                                <Bot className="w-4 h-4 text-blue-600" />
                            )}
                        </div>

                        <div className={`p-4 rounded-2xl ${msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start space-x-3 max-w-[80%]">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-100 rounded-tl-none flex items-center space-x-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Type your message..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
