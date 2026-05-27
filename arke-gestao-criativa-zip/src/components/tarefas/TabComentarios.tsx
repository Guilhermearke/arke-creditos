import React, { useState, useRef, useEffect } from 'react';
import { useArkeStore, Comentario } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrigemIcon } from '@/components/integracoes/OrigemBadge';
import * as queries from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  tarefaId: string;
  comentarios: Comentario[];
  setComentarios: React.Dispatch<React.SetStateAction<Comentario[]>>;
}

export function TabComentarios({ tarefaId, comentarios, setComentarios }: Props) {
  const { timeMembers } = useArkeStore();
  const { role, profileId } = useAuth();
  const [novoComentario, setNovoComentario] = useState('');
  const [isInterno, setIsInterno] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filtrar notas ocultas se user for cliente
  const isCliente = role === 'cliente';
  const lista = comentarios.filter(c => isCliente ? !c.interno : true);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lista.length]);

  const handleSend = async () => {
    if (!novoComentario.trim() || !profileId) return;
    
    const txt = novoComentario.trim();
    setNovoComentario('');
    
    try {
      const data = {
        tarefa_id: tarefaId,
        autor_id: profileId,
        role_autor: role,
        conteudo: txt,
        interno: isInterno
      };
      
      const res = await queries.createComentario(data);
      if (res) {
        const updatedList = await queries.fetchComentarios(tarefaId);
        setComentarios(updatedList);
        scrollToBottom();
      }
    } catch (e) {
      toast.error('Erro ao enviar comentário');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl">
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-6 pr-4 space-y-6 custom-scrollbar pb-10">
        {lista.map(com => {
          // Backward compatibility for old format vs new Supabase joined format
          const autorObj = typeof com.autor === 'object' ? com.autor : null;
          const autorNome = autorObj ? autorObj.nome : (com.autor || 'Desconhecido');
          const autorRole = autorObj ? autorObj.role : (com.role_autor || com.role || 'time');
          const avatarChar = typeof autorNome === 'string' ? autorNome.charAt(0) : 'U';

          return (
            <div key={com.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
                {autorRole === 'cliente' ? <User className="w-5 h-5 text-slate-500" /> : <span className="font-bold text-slate-600 text-sm uppercase">{avatarChar}</span>}
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-slate-900">{typeof autorNome === 'string' ? autorNome : 'Arke User'}</span>
                  <span className="text-xs text-slate-400 capitalize">{autorRole === 'time' ? 'Arke Team' : autorRole}</span>
                  <span className="text-xs text-slate-400">&bull; {com.created_at ? format(new Date(com.created_at), "HH:mm") : (com.data ? format(new Date(com.data), "HH:mm") : '')}</span>
                  {com.origem && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">
                      <OrigemIcon origem={com.origem} className="w-3 h-3" />
                    </span>
                  )}
                </div>
                
                <div className={cn(
                  "p-4 rounded-xl rounded-tl-none inline-block max-w-[90%] break-words text-sm",
                  com.interno 
                    ? "bg-amber-50 border border-amber-200/60 text-amber-900" 
                    : "bg-slate-100 border border-slate-200/50 text-slate-700"
                )}>
                  {com.interno && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-600">
                      <Lock className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Nota Interna</span>
                    </div>
                  )}
                  {com.conteudo}
                </div>
              </div>
            </div>
          )
        })}

        {lista.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            Nenhum comentário ainda. Inicie a conversa.
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-2">
        <Textarea 
          placeholder="Escreva seu comentário... (Ctrl + Enter para enviar)" 
          className="border-0 focus-visible:ring-0 resize-none min-h-[60px] bg-transparent text-slate-700"
          value={novoComentario}
          onChange={e => setNovoComentario(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-between px-2 pb-1 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-2">
            {!isCliente && (
              <>
                <Switch 
                  id="interno-mode" 
                  checked={isInterno}
                  onCheckedChange={setIsInterno}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label htmlFor="interno-mode" className={cn(
                  "text-xs font-semibold uppercase tracking-wider cursor-pointer",
                  isInterno ? "text-amber-600" : "text-slate-400"
                )}>
                  Ocultar do Cliente
                </Label>
              </>
            )}
          </div>
          <Button onClick={handleSend} disabled={!novoComentario.trim()} className="h-8 gap-2 bg-[#2563EB] hover:bg-blue-700">
            <Send className="w-3.5 h-3.5" /> Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
