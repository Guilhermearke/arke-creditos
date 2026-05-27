import React from 'react';
import { Slack, Trello, Columns3, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Origem } from '@/lib/store';

export function OrigemIcon({ origem, className }: { origem: Origem, className?: string }) {
  if (origem === 'slack') return <Slack className={cn("text-[#4A154B]", className)} />;
  if (origem === 'trello') return <Trello className={cn("text-[#0052CC]", className)} />;
  if (origem === 'clickup') return <Columns3 className={cn("text-[#7B68EE]", className)} />;
  return <MessageSquare className={cn("text-slate-400", className)} />;
}
