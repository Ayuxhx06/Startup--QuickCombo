'use client';
import { useState } from 'react';
import { Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function ManualAddBox() {
    const { addItem } = useCart();
    const [name, setName] = useState('');
    const [qty, setQty] = useState(1);
    const [unit, setUnit] = useState('piece');

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!name.trim()) {
            toast.error('Please enter item name');
            return;
        }
        addItem({
            id: `manual-${Date.now()}`,
            name: name.trim(),
            price: 0,
            quantity: qty,
            unit: unit,
            image_url: '',
            is_veg: true,
            category_name: 'Essentials'
        });
        setName('');
        setQty(1);
        toast.success(`Added ${name} to cart`);
    };

    return (
        <div className="bg-[#111] border border-green-500/20 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-black uppercase italic text-base tracking-tight text-white">Add Special Request / Note</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Custom items delivered to your doorstep</p>
                </div>
            </div>

            <div className="space-y-5">
                <div className="relative">
                    <input 
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="E.g. 555 Cigarette, 1L Milk, Specific medicine..."
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-green-500/50 transition-all font-medium placeholder:text-gray-600"
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl p-1.5 h-12">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/5 active:scale-90 transition-all"><Minus size={18}/></button>
                            <span className="w-10 text-center font-black text-sm text-white">{qty}</span>
                            <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-green-500 hover:bg-white/5 active:scale-90 transition-all"><Plus size={18}/></button>
                        </div>

                        {/* Quick Increment Buttons */}
                        <div className="flex gap-2">
                            {[1, 2, 5].map(v => (
                                <button 
                                    key={v}
                                    onClick={() => setQty(qty + v)}
                                    className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all active:scale-95"
                                >
                                    +{v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-black/60 border border-white/10 rounded-2xl p-1 h-12">
                            {['piece', 'kg', 'litre'].map(u => (
                                <button 
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${unit === u ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {u === 'piece' ? 'Pc' : u === 'kg' ? 'Kg' : 'Lt'}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleAdd}
                            className="flex-grow bg-green-500 text-black font-black uppercase h-12 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all text-xs tracking-widest shadow-xl shadow-green-500/10 active:scale-[0.98]"
                        >
                            <ShoppingCart size={18} /> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
