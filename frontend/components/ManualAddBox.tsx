'use client';
import { useState } from 'react';
import { Package, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function ManualAddBox() {
    const { addSpecialRequest, specialRequests, removeSpecialRequest } = useCart();
    const [name, setName] = useState('');
    const [qtyText, setQtyText] = useState('1');
    const [unit, setUnit] = useState('piece');

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!name.trim()) {
            toast.error('Please enter item name');
            return;
        }
        const parsedQty = parseFloat(qtyText);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            toast.error('Enter a valid quantity (e.g. 1, 0.5, 2.5)');
            return;
        }
        addSpecialRequest({
            id: `req-${Date.now()}`,
            name: name.trim(),
            quantity: parsedQty,
            unit: unit,
        });
        setName('');
        setQtyText('1');
        toast.success(`Special request added!`);
    };

    return (
        <div className="bg-[#111] border border-green-500/20 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
            
            <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-black uppercase italic text-base tracking-tight text-white">Special Request</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Pay to delivery partner on arrival</p>
                </div>
            </div>

            {/* Existing requests */}
            {specialRequests.length > 0 && (
                <div className="mb-4 space-y-2">
                    {specialRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
                            <div>
                                <p className="text-sm font-bold text-white">{req.quantity} {req.unit === 'piece' ? 'pc' : req.unit} {req.name}</p>
                                <p className="text-[10px] text-orange-400 font-bold">Pay on delivery</p>
                            </div>
                            <button onClick={() => removeSpecialRequest(req.id)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {/* Item Name */}
                <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(e as any); }}
                    placeholder="E.g. 0.5L Milk, Cigarette, Medicine..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-green-500/50 transition-all font-medium placeholder:text-gray-600"
                />

                {/* Quantity + Unit Row */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Qty</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0.1"
                            value={qtyText}
                            onChange={e => setQtyText(e.target.value)}
                            placeholder="e.g. 0.5"
                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-all font-black text-white placeholder:text-gray-600 text-center"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Unit</label>
                        <div className="flex bg-black/60 border border-white/10 rounded-2xl p-1 h-[46px]">
                            {['piece', 'kg', 'litre'].map(u => (
                                <button 
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${unit === u ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {u === 'piece' ? 'Pc' : u === 'kg' ? 'Kg' : 'Lt'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <button 
                    onClick={handleAdd}
                    className="w-full bg-green-500 text-black font-black uppercase h-12 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all text-xs tracking-widest shadow-xl shadow-green-500/10 active:scale-[0.98]"
                >
                    <ShoppingCart size={18} /> Add Request
                </button>
            </div>
        </div>
    );
}
