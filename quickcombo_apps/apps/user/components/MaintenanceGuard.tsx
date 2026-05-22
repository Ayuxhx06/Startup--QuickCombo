'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction, Sparkles, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
