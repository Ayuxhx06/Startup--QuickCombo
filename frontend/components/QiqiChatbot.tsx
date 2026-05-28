'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  restaurant_name: string;
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
      content: "Hi! I'm Qiqi, your food mood buddy. 😋 How are you feeling today? Need a combo recommendation?",
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
        content: "Oops, my brain is taking a quick nap! Please check if my Gemini API key is configured. 😴",
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

  // Add to cart functionality (simplistic version for the demo)
  const handleAddToCart = (combo: Combo) => {
    // Note: Since this is a floating component, it will just use localStorage or a toast to show it's added.
    // Assuming cart is an array in localStorage.
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push({
        type: 'combo',
        id: combo.id,
        name: combo.name,
        price: combo.price,
        quantity: 1,
      });
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      alert(`Added ${combo.name} to cart!`);
    } catch (err) {
      console.error("Cart error", err);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-50 overflow-hidden"
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <span className="text-2xl">✨</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] max-h-[600px] h-[75vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Qiqi</h3>
              <p className="text-xs text-pink-100">Your AI Food Buddy</p>
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
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Combo Suggestions */}
                {msg.suggested_combos && msg.suggested_combos.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 w-full max-w-[280px]">
                    {msg.suggested_combos.map((combo) => (
                      <div key={combo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {combo.image_url && (
                          <img src={combo.image_url} alt={combo.name} className="w-full h-24 object-cover" />
                        )}
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-gray-800">{combo.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{combo.description}</p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="font-bold text-purple-600">₹{combo.price}</span>
                            <button 
                              onClick={() => handleAddToCart(combo)}
                              className="bg-purple-50 text-purple-600 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                            >
                              Add
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
              <div className="self-start bg-white border border-gray-100 text-gray-800 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              className="bg-purple-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
