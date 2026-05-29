'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  restaurant_name?: string;
  restaurant?: number | string;
  category_name?: string;
}

interface Combo {
  id: string | number;
  name: string;
  description: string;
  price: string | number;
  image_url?: string;
  restaurant_name?: string;
  items?: MenuItem[];
  is_dynamic?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'qiqi';
  content: string;
  suggested_combos?: Combo[];
}

interface QiqiChatbotProps {
  autoOpen?: boolean;
  fullPage?: boolean;
}

export default function QiqiChatbot({ autoOpen = false, fullPage = false }: QiqiChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'qiqi',
      content: "Hi! I'm Qiqi, your food mood buddy.  How are you feeling today? Need a custom combo?",
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/qiqi/chat/`, {
        message: userMessage.content,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const qiqiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'qiqi',
        content: response.data.reply,
        suggested_combos: response.data.suggested_combos,
      };

      setMessages((prev) => [...prev, qiqiMessage]);
    } catch (error) {
      console.error('Qiqi Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'qiqi',
        content: "Oops, my brain is taking a quick nap! Please try again later. ",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Add all items from a dynamic combo to cart using real CartContext
  const handleAddToCart = (combo: Combo) => {
    if (combo.is_dynamic && combo.items && combo.items.length > 0) {
      combo.items.forEach(item => {
        addItem({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          image_url: item.image_url || '',
          is_veg: item.is_veg ?? true,
          restaurant: item.restaurant,
          restaurant_name: item.restaurant_name,
          category_name: item.category_name,
        });
      });
      toast.success(`${combo.name} added to cart! `, { duration: 2000, icon: '' });
    } else {
      // Fallback for a non-dynamic combo (shouldn't normally happen)
      toast.error("Couldn't add this combo. Please try again.");
    }
  };

  return (
    <>
      {/* Floating Action Button Container — sits ABOVE the bottom nav bar */}
      {!fullPage && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
          {/* Pulsing Tooltip — only show when chat is closed */}
          {!isOpen && (
            <div
              className="bg-white px-4 py-2 rounded-xl shadow-lg border border-purple-100 animate-bounce relative mr-1"
              style={{ pointerEvents: 'none' }}
            >
              <span className="text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Craving something? Chat with Qiqi! 
              </span>
              {/* Tooltip Triangle pointing down */}
              <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-b border-r border-purple-100 transform rotate-45" />
            </div>
          )}

          {/* Main Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_18px_rgba(168,85,247,0.5)] hover:shadow-[0_0_28px_rgba(168,85,247,0.7)] transition-all hover:-translate-y-1 overflow-hidden relative ${!isOpen ? 'animate-pulse' : ''}`}
          >
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity" />
            {isOpen ? (
              <span className="text-2xl font-bold"></span>
            ) : (
              <span className="text-2xl relative z-10 drop-shadow-md"></span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window — opens upward from above the FAB */}
      {(isOpen || fullPage) && (
        <div 
          className={
            fullPage 
              ? "fixed inset-0 bg-white flex flex-col z-[60]" 
              : "fixed bottom-36 right-4 w-[340px] max-h-[560px] h-[72vh] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-100 overflow-hidden"
          }
          style={!fullPage ? { animation: 'slideUp 0.25s ease-out' } : {}}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white flex items-center gap-3 shrink-0">
            {fullPage && (
              <button onClick={() => router.back()} className="mr-1 text-white hover:text-white/80 transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">
              
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Qiqi</h3>
              <p className="text-xs text-pink-100 font-medium">Your AI Food Buddy</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-sm shadow-md'
                      : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Combo Suggestion Cards */}
                {msg.suggested_combos && msg.suggested_combos.length > 0 && (
                  <div className="mt-2 flex flex-col gap-3 w-full max-w-[280px]">
                    {msg.suggested_combos.map((combo) => (
                      <div key={combo.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                        {/* Gradient header for dynamic combos */}
                        <div className="w-full h-10 bg-gradient-to-r from-pink-100 to-purple-100 flex items-center px-3 border-b border-gray-50">
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider"> Custom Combo</span>
                        </div>

                        <div className="p-3">
                          <h4 className="font-bold text-sm text-gray-800">{combo.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5 italic line-clamp-2">{combo.description}</p>

                          {/* Item list */}
                          {combo.is_dynamic && combo.items && combo.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {combo.items.map(item => (
                                  <li key={item.id} className="flex justify-between items-center">
                                    <span className="truncate pr-2">• {item.name}</span>
                                    <span className="text-purple-500 font-semibold shrink-0">₹{item.price}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] text-gray-400 leading-none">Total</p>
                              <span className="font-bold text-purple-600 text-sm">₹{combo.price}</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(combo)}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow hover:shadow-lg transition-all active:scale-95 hover:opacity-90"
                            >
                              Add to Cart 
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading dots */}
            {isLoading && (
              <div className="self-start bg-white border border-gray-100 text-gray-800 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me your mood..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-black"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
