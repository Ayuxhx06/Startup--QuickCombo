'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QiqiChatbot from '@/components/QiqiChatbot';

export default function QiqiPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Render Qiqi in auto-open full-page mode */}
      <QiqiChatbot autoOpen={true} fullPage={true} />
    </div>
  );
}
