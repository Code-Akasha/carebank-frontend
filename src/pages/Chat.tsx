import React, { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    sender: "user" | "agent";
    content: string;
    timestamp: Date;
    uiActions?: UIAction[];
}

interface UIAction {
    label: string;
    message: string;
}

const isUIAction = (value: unknown): value is UIAction => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    return typeof record.label === "string" && typeof record.message === "string";
};

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("/api/chat/history");
                const historyMessages = response.data.messages.map((msg: { id: string; sender: "user" | "agent"; content: string; timestamp: string }) => ({
                    id: msg.id,
                    sender: msg.sender,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp)
                }));
                
                const greeting: Message = {
                    id: "greeting",
                    sender: "agent",
                    content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I'm your CareBank AI assistant. I can help you with transactions, balance inquiries, financial advice, or understanding your spending. How can I assist you today?`,
                    timestamp: new Date()
                };

                // Add greeting first, then history
                setMessages([greeting, ...historyMessages]);
            } catch (err) {
                console.error("Failed to fetch history:", err);
                // Fallback to just greeting
                setMessages([{
                    id: "greeting",
                    sender: "agent",
                    content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I'm your CareBank AI assistant. I can help you with transactions, balance inquiries, financial advice, or understanding your spending. How can I assist you today?`,
                    timestamp: new Date()
                }]);
            } finally {
                setFetchingHistory(false);
            }
        };
        fetchHistory();
    }, [user]);

    useEffect(() => {
        if (!fetchingHistory) {
            scrollToBottom();
        }
    }, [messages, fetchingHistory]);

    const sendMessage = async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            content: trimmed,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await api.post("/api/chat", {
                message: userMessage.content,
            });

            const rawActions = response.data?.ui_actions;
            const uiActions: UIAction[] = Array.isArray(rawActions)
                ? rawActions.filter(isUIAction)
                : [];

            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "agent",
                content: response.data.response,
                timestamp: new Date(),
                uiActions
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        const content = input;
        setInput("");
        await sendMessage(content);
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-slate-50/50 rounded-3xl shadow-xl border border-white/40 backdrop-blur-xl overflow-hidden relative">
            <div className="bg-white/70 backdrop-blur-md p-4 border-b border-slate-200/50 flex items-center space-x-4 sticky top-0 z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex justify-center items-center shadow-lg shadow-blue-500/20">
                    <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">CareBank Assistant</h2>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                        <p className="text-xs text-slate-500 font-medium">Powered by AI Agents</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                            key={msg.id}
                            className={`flex items-end space-x-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mb-1 ${msg.sender === 'user' ? 'bg-gradient-to-br from-slate-200 to-slate-300' : 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-white'}`}>
                                {msg.sender === 'user' ? (
                                    <UserIcon className="w-4 h-4 text-slate-600" />
                                ) : (
                                    <Bot className="w-4 h-4 text-blue-600" />
                                )}
                            </div>

                            <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-[20px] shadow-sm ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-[4px]'
                                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-[4px]'
                                    }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    
                                    {msg.sender === "agent" && msg.uiActions && msg.uiActions.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {msg.uiActions.map((action, idx) => (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    key={`${msg.id}-action-${idx}`}
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => sendMessage(action.message)}
                                                    className={
                                                        idx === 0
                                                            ? "px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                                            : "px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    }
                                                >
                                                    {action.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] mt-1.5 px-1 font-medium text-slate-400">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end space-x-3 max-w-[80%]"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-white shadow-sm mb-1">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="p-5 rounded-[20px] bg-white border border-slate-100 rounded-bl-[4px] flex items-center space-x-2 shadow-sm h-[52px]">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/50">
                <form onSubmit={handleSend} className="relative flex items-center max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Type a message..."
                        className="w-full pl-5 pr-14 py-4 bg-slate-100/80 border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 text-[15px] shadow-sm"
                    />
                    <motion.button
                        whileHover={!loading && input.trim() ? { scale: 1.05 } : {}}
                        whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2.5 text-white bg-blue-600 rounded-xl disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </motion.button>
                </form>
            </div>
        </div>
    );
}
