'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  restaurant_name: string;
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

export default function QiqiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'qiqi',
      content: "Hi! I'm Qiqi, your food mood buddy. 😋 How are you feeling today? Need a custom combo?",
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        content: "Oops, my brain is taking a quick nap! Please try again later. 😴",
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

  // Add to cart functionality (adds all individual items from the dynamic combo)
  const handleAddToCart = (combo: Combo) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (combo.is_dynamic && combo.items) {
        // Add each individual item from the dynamic combo
        combo.items.forEach(item => {
          cart.push({
            type: 'item',
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          });
        });
        alert(`Added ${combo.items.length} items from ${combo.name} to your cart!`);
      } else {
        // Fallback for predefined combo or if items missing
        cart.push({
          type: 'combo',
          id: combo.id,
          name: combo.name,
          price: combo.price,
          quantity: 1,
        });
        alert(`Added ${combo.name} to cart!`);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error("Cart error", err);
    }
  };

  return (
    <>
      {/* Floating Action Button Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Pulsing Tooltip (Only show when closed) */}
        {!isOpen && (
          <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-purple-100 animate-bounce relative mr-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Craving something? Chat with Qiqi! ✨
            </span>
            {/* Tooltip Triangle */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-purple-100 transform rotate-45"></div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all hover:-translate-y-1 overflow-hidden relative ${!isOpen ? 'animate-pulse' : ''}`}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity"></div>
          {isOpen ? (
            <span className="text-3xl">✕</span>
          ) : (
            <span className="text-3xl relative z-10 drop-shadow-md">✨</span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 w-[350px] max-h-[600px] h-[75vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Qiqi</h3>
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

                {/* Combo Suggestions */}
                {msg.suggested_combos && msg.suggested_combos.length > 0 && (
                  <div className="mt-2 flex flex-col gap-3 w-full max-w-[280px]">
                    {msg.suggested_combos.map((combo) => (
                      <div key={combo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* If it's a dynamic combo, we might not have a single image, so maybe show a nice gradient header */}
                        {combo.image_url ? (
                          <img src={combo.image_url} alt={combo.name} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-12 bg-gradient-to-r from-pink-100 to-purple-100 flex items-center px-3 border-b border-gray-50">
                             <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">✨ Custom Combo</span>
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-gray-800">{combo.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">{combo.description}</p>
                          
                          {/* List items if dynamic */}
                          {combo.is_dynamic && combo.items && (
                            <div className="mt-2 pt-2 border-t border-gray-50">
                              <ul className="text-xs text-gray-600 space-y-1">
                                {combo.items.map(item => (
                                  <li key={item.id} className="flex justify-between">
                                    <span className="truncate pr-2">• {item.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-3 pt-2">
                            <span className="font-bold text-purple-600">₹{combo.price}</span>
                            <button 
                              onClick={() => handleAddToCart(combo)}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                              Add All
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
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
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
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
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

