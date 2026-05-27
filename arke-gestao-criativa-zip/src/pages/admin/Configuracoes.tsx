import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, Zap, Users, Shield, Box, Save, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { criarAcessoCliente } from '@/lib/supabase/admin-queries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Helper custom hook for debounced state updates
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminConfiguracoes() {
  const [activeTab, setActiveTab] = useState('servicos');

  // Sec 1 - Servicos
  const [servicos, setServicos] = useState<any[]>([]);
  const [newServico, setNewServico] = useState(false);
  const [servForm, setServForm] = useState({ nome: '', creditos_padrao: 0, categoria: '', ativo: true });

  // Sec 2 - Planos
  const [planos, setPlanos] = useState<any[]>([]);
  const [newPlano, setNewPlano] = useState(false);
  const [planForm, setPlanForm] = useState({ nome: '', creditos_mensais: 0, valor_mensal: 0, percentual_revisao: 0, revisoes_incluidas: 1, creditos_acumulam: false, ativo: true });

  // Sec 3 - Time
  const [timeMembers, setTimeMembers] = useState<any[]>([]);
  const [timeModal, setTimeModal] = useState({ open: false, email: '', senha: '', nome: '', funcao: '', role: 'time' });
  const [timeResult, setTimeResult] = useState<{ open: boolean, email: string, senha: string }>({ open: false, email: '', senha: '' });

  // Sec 4 - Integracoes
  const [configsGlobais, setConfigsGlobais] = useState<Record<string, string>>({});
  const [trelloBoards, setTrelloBoards] = useState<any[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: srv } = await supabase.from('servicos').select('*').order('categoria').order('nome');
      if (srv) setServicos(srv);
      
      const { data: pln } = await supabase.from('planos').select('*').order('nome');
      if (pln) setPlanos(pln);
      
      const { data: tm } = await supabase.from('profiles').select('*').in('role', ['time', 'admin']).order('nome');
      if (tm) setTimeMembers(tm);

      const { data: globs } = await supabase.from('configuracoes_sistema').select('*');
      if (globs) {
        setConfigsGlobais(Object.fromEntries(globs.map(g => [g.id, g.valor])));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Serviços ---
  const handleServicoChange = async (index: number, field: string, value: any) => {
    const updated = [...servicos];
    updated[index][field] = value;
    setServicos(updated);
    
    // Save to DB immediately with "inline" feel (In a real app, use a proper debounce hook)
    clearTimeout((window as any)._servicoTimer);
    (window as any)._servicoTimer = setTimeout(async () => {
      const s = updated[index];
      await supabase.from('servicos').update({ [field]: value }).eq('id', s.id);
      toast.success('Serviço atualizado');
    }, 800) as any;
  };

  const saveNewServico = async () => {
    if (!servForm.nome) return;
    const { data: result, error } = await supabase.from('servicos').insert([servForm]).select().single();
    if (!error && result) {
      setServicos([...servicos, result]);
      setNewServico(false);
      setServForm({ nome: '', creditos_padrao: 0, categoria: '', ativo: true });
      toast.success('Serviço criado');
    }
  };

  // --- Planos ---
  const handlePlanoChange = async (index: number, field: string, value: any) => {
    const updated = [...planos];
    updated[index][field] = value;
    setPlanos(updated);
    
    clearTimeout((window as any)._planoTimer);
    (window as any)._planoTimer = setTimeout(async () => {
      const p = updated[index];
      await supabase.from('planos').update({ [field]: value }).eq('id', p.id);
      toast.success('Plano atualizado');
    }, 800) as any;
  };

  const saveNewPlano = async () => {
    if (!planForm.nome) return;
    const { data: result, error } = await supabase.from('planos').insert([planForm]).select().single();
    if (!error && result) {
      setPlanos([...planos, result]);
      setNewPlano(false);
      setPlanForm({ nome: '', creditos_mensais: 0, valor_mensal: 0, percentual_revisao: 0, revisoes_incluidas: 1, creditos_acumulam: false, ativo: true });
      toast.success('Plano criado');
    }
  };

  // --- Time ---
  const handleTimeChange = async (index: number, field: string, value: any) => {
    const updated = [...timeMembers];
    updated[index][field] = value;
    setTimeMembers(updated);
    
    clearTimeout((window as any)._timeTimer);
    (window as any)._timeTimer = setTimeout(async () => {
      const p = updated[index];
      await supabase.from('profiles').update({ [field]: value }).eq('id', p.id);
      toast.success('Membro da equipe atualizado');
    }, 800) as any;
  };

  const saveNovoMembro = async () => {
    if (!timeModal.nome || !timeModal.email) return;
    try {
      const creds = await criarAcessoCliente(timeModal.email, null, timeModal.nome);
      // Wait for edge function profile sync
      setTimeout(async () => {
         // Force role
         const { data: users } = await supabase.from('profiles').select('id').eq('email', timeModal.email);
         if (users && users.length > 0) {
            await supabase.from('profiles').update({ role: timeModal.role, funcao: timeModal.funcao }).eq('id', users[0].id);
         }
         loadData();
      }, 500);

      setTimeModal({ open: false, email: '', senha: '', nome: '', funcao: '', role: 'time' });
      setTimeResult({ open: true, email: (creds as any)?.email || timeModal.email, senha: creds.senha });
      toast.success('Membro criado com sucesso');
    } catch (e: any) {
      toast.error('Erro ao adicionar membro: ' + e.message);
    }
  };

  // --- Integrações ---
  const updateGlobal = async (key: string, value: string) => {
    setConfigsGlobais(prev => ({...prev, [key]: value}));
    await supabase.from('configuracoes_sistema').upsert({ id: key, valor: value });
    toast.success('Configuração salva');
  };

  const testarTrello = async () => {
    try {
      const res = await fetch(`https://api.trello.com/1/members/me?key=${configsGlobais.trello_api_key}&token=${configsGlobais.trello_token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success('Trello conectado: ' + data.fullName);
    } catch {
      toast.error('Credenciais do Trello inválidas');
    }
  };

  const carregarQuadrosTrello = async () => {
    setLoadingBoards(true);
    try {
      const res = await fetch(`https://api.trello.com/1/members/me/boards?key=${configsGlobais.trello_api_key}&token=${configsGlobais.trello_token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTrelloBoards(data);
    } catch {
      toast.error('Não foi possível carregar os quadros.');
    } finally {
      setLoadingBoards(false);
    }
  };

  const toggleBoardTrello = (boardId: string, checked: boolean) => {
    const ativos = configsGlobais.trello_boards_ativos ? JSON.parse(configsGlobais.trello_boards_ativos) : [];
    const nw = checked ? [...ativos, boardId] : ativos.filter((b: string) => b !== boardId);
    updateGlobal('trello_boards_ativos', JSON.stringify(nw));
  };


  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações Gerais</h1>
        <p className="text-sm text-slate-500">Parâmetros do sistema, inteligência de créditos e cadastros globais.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-xl shadow-sm border border-slate-200">
         <div className="border-b border-slate-100 flex p-1">
            <TabsList className="bg-transparent gap-2 h-14 w-full justify-start text-slate-500 overflow-x-auto">
               <TabsTrigger value="servicos" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 gap-2 h-10 px-4 rounded-md font-semibold">
                 <Box className="w-4 h-4" /> Serviços e Valores
               </TabsTrigger>
               <TabsTrigger value="planos" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 gap-2 h-10 px-4 rounded-md font-semibold">
                 <Shield className="w-4 h-4" /> Planos Keep
               </TabsTrigger>
               <TabsTrigger value="time" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 gap-2 h-10 px-4 rounded-md font-semibold">
                 <Users className="w-4 h-4" /> Time Arke
               </TabsTrigger>
               <TabsTrigger value="integracoes" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 gap-2 h-10 px-4 rounded-md font-semibold">
                 <Zap className="w-4 h-4" /> Integrações Externas
               </TabsTrigger>
            </TabsList>
         </div>

         <div className="p-6">
            
            {/* SERVIÇOS E VALORES */}
            <TabsContent value="servicos" className="mt-0 outline-none space-y-4">
               <div>
                  <h3 className="font-bold text-lg">Serviços Disponíveis</h3>
                  <p className="text-sm text-slate-500 mb-4">Gerencie as categorias de serviços e os créditos cobrados por padrão.</p>
               </div>
               
               <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-sm font-semibold text-slate-500">
                  <div className="col-span-5">Nome do Serviço</div>
                  <div className="col-span-3">Categoria</div>
                  <div className="col-span-2 text-center">Créditos</div>
                  <div className="col-span-2 text-center">Ativo?</div>
               </div>
               
               {servicos.map((s, idx) => (
                  <div key={s.id || idx} className="grid grid-cols-12 gap-4 border-b border-slate-100 py-2 items-center text-sm">
                     <div className="col-span-5"><Input value={s.nome} onChange={(e) => handleServicoChange(idx, 'nome', e.target.value)} className="h-8 shadow-none" /></div>
                     <div className="col-span-3"><Input value={s.categoria || ''} onChange={(e) => handleServicoChange(idx, 'categoria', e.target.value)} className="h-8 shadow-none" /></div>
                     <div className="col-span-2 px-2"><Input type="number" value={s.creditos_padrao} onChange={(e) => handleServicoChange(idx, 'creditos_padrao', parseInt(e.target.value)||0)} className="h-8 shadow-none text-center" /></div>
                     <div className="col-span-2 flex justify-center items-center">
                        <Checkbox checked={s.ativo} onCheckedChange={(c) => handleServicoChange(idx, 'ativo', !!c)} />
                     </div>
                  </div>
               ))}

               {newServico && (
                  <div className="grid grid-cols-12 gap-4 border border-blue-200 bg-blue-50 py-3 px-2 items-center text-sm rounded-md mt-4">
                     <div className="col-span-4"><Input placeholder="Nome novo serviço" value={servForm.nome} onChange={e=>setServForm({...servForm, nome: e.target.value})} className="h-8 bg-white" /></div>
                     <div className="col-span-3"><Input placeholder="Categoria" value={servForm.categoria} onChange={e=>setServForm({...servForm, categoria: e.target.value})} className="h-8 bg-white" /></div>
                     <div className="col-span-2"><Input type="number" placeholder="Créditos" value={servForm.creditos_padrao} onChange={e=>setServForm({...servForm, creditos_padrao: parseInt(e.target.value)||0})} className="h-8 bg-white text-center" /></div>
                     <div className="col-span-3 flex justify-end gap-2 pr-2">
                        <Button variant="ghost" size="sm" onClick={() => setNewServico(false)}>Cancelar</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={saveNewServico}>Salvar</Button>
                     </div>
                  </div>
               )}

               {!newServico && (
                 <Button variant="outline" className="mt-4 gap-2" onClick={() => setNewServico(true)}>
                   <Plus className="w-4 h-4" /> Novo Serviço
                 </Button>
               )}
            </TabsContent>

            {/* PLANOS KEEP */}
            <TabsContent value="planos" className="mt-0 outline-none space-y-4">
               <div>
                  <h3 className="font-bold text-lg">Planos Keep (Assinatura)</h3>
                  <p className="text-sm text-slate-500 mb-4">Gerencie as assinaturas mensais oferecidas pela Arke.</p>
               </div>
               
               <div className="overflow-x-auto">
                 <div className="min-w-[800px]">
                     <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-200 text-xs font-semibold text-slate-500 text-center items-center">
                        <div className="col-span-3 text-left">Nome do Plano</div>
                        <div className="col-span-2">Mensalidade (R$)</div>
                        <div className="col-span-2">Créditos/Mês</div>
                        <div className="col-span-2">Custo Revisão (%)</div>
                        <div className="col-span-2">Acumula?</div>
                        <div className="col-span-1">Ativo?</div>
                     </div>
                     
                     {planos.map((p, idx) => (
                        <div key={p.id || idx} className="grid grid-cols-12 gap-2 border-b border-slate-100 py-2 items-center text-sm">
                           <div className="col-span-3"><Input value={p.nome} onChange={e => handlePlanoChange(idx, 'nome', e.target.value)} className="h-8 shadow-none text-xs" /></div>
                           <div className="col-span-2 px-1"><Input type="number" value={p.valor_mensal} onChange={e => handlePlanoChange(idx, 'valor_mensal', parseInt(e.target.value)||0)} className="h-8 shadow-none text-center text-xs" /></div>
                           <div className="col-span-2 px-1"><Input type="number" value={p.creditos_mensais} onChange={e => handlePlanoChange(idx, 'creditos_mensais', parseInt(e.target.value)||0)} className="h-8 shadow-none text-center text-xs" /></div>
                           <div className="col-span-2 px-1"><Input type="number" value={p.percentual_revisao} onChange={e => handlePlanoChange(idx, 'percentual_revisao', parseInt(e.target.value)||0)} className="h-8 shadow-none text-center text-xs" /></div>
                           <div className="col-span-2 flex justify-center"><Checkbox checked={p.creditos_acumulam} onCheckedChange={c => handlePlanoChange(idx, 'creditos_acumulam', !!c)} /></div>
                           <div className="col-span-1 flex justify-center"><Checkbox checked={p.ativo} onCheckedChange={c => handlePlanoChange(idx, 'ativo', !!c)} /></div>
                        </div>
                     ))}

                     {newPlano && (
                        <div className="grid grid-cols-12 gap-2 border border-purple-200 bg-purple-50 py-3 px-2 items-center text-sm rounded-md mt-4">
                           <div className="col-span-2"><Input placeholder="Nome" value={planForm.nome} onChange={e=>setPlanForm({...planForm, nome: e.target.value})} className="h-8 text-xs bg-white" /></div>
                           <div className="col-span-2 px-1"><Input type="number" placeholder="R$" value={planForm.valor_mensal} onChange={e=>setPlanForm({...planForm, valor_mensal: parseInt(e.target.value)||0})} className="h-8 bg-white text-center text-xs" /></div>
                           <div className="col-span-2 px-1"><Input type="number" placeholder="Cr" value={planForm.creditos_mensais} onChange={e=>setPlanForm({...planForm, creditos_mensais: parseInt(e.target.value)||0})} className="h-8 bg-white text-center text-xs" /></div>
                           <div className="col-span-2 px-1"><Input type="number" placeholder="%" value={planForm.percentual_revisao} onChange={e=>setPlanForm({...planForm, percentual_revisao: parseInt(e.target.value)||0})} className="h-8 bg-white text-center text-xs" /></div>
                           <div className="col-span-4 flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setNewPlano(false)} className="h-8 text-xs">Cancelar</Button>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs" onClick={saveNewPlano}>Salvar</Button>
                           </div>
                        </div>
                     )}
                 </div>
               </div>

               {!newPlano && (
                 <Button variant="outline" className="mt-4 gap-2 text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => setNewPlano(true)}>
                   <Plus className="w-4 h-4" /> Novo Plano
                 </Button>
               )}
            </TabsContent>

            {/* TIME ARKE */}
            <TabsContent value="time" className="mt-0 outline-none space-y-4">
               <div>
                  <h3 className="font-bold text-lg">Membros da Equipe</h3>
                  <p className="text-sm text-slate-500 mb-4">Pessoas com acesso ao painel de administração e execução.</p>
               </div>
               
               <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-sm font-semibold text-slate-500 items-center">
                  <div className="col-span-4">Nome</div>
                  <div className="col-span-3 text-center">Nível (Role)</div>
                  <div className="col-span-5">Função (Cargo)</div>
               </div>
               
               {timeMembers.map((m, idx) => (
                  <div key={m.id || idx} className="grid grid-cols-12 gap-4 border-b border-slate-100 py-2 items-center text-sm">
                     <div className="col-span-4"><Input value={m.nome} onChange={(e) => handleTimeChange(idx, 'nome', e.target.value)} className="h-8 shadow-none" /></div>
                     <div className="col-span-3 flex justify-center">
                        <select className="h-8 rounded-md border border-slate-200 w-full px-2" value={m.role} onChange={e => handleTimeChange(idx, 'role', e.target.value)}>
                           <option value="time">Time</option>
                           <option value="admin">Administrador</option>
                        </select>
                     </div>
                     <div className="col-span-5"><Input value={m.funcao || ''} onChange={(e) => handleTimeChange(idx, 'funcao', e.target.value)} className="h-8 shadow-none" placeholder="Ex: Designer UI/UX" /></div>
                  </div>
               ))}

               <Button variant="outline" className="mt-4 gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => setTimeModal({ ...timeModal, open: true })}>
                 <Plus className="w-4 h-4" /> Adicionar Membro
               </Button>
            </TabsContent>

            {/* INTEGRAÇÕES EXTERNAS */}
            <TabsContent value="integracoes" className="mt-0 outline-none space-y-6">
               <div>
                  <h3 className="font-bold text-lg mb-1">Integrações de API</h3>
                  <p className="text-sm text-slate-500 mb-6">Conexões com serviços externos para recebimento de demandas automáticas.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TRELLO */}
                  <Card className="border-blue-100 shadow-sm overflow-hidden">
                     <div className="h-1 bg-blue-500 w-full" />
                     <CardHeader className="pb-3 bg-blue-50/30">
                        <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                           Trello (Sincronização de Demandas)
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4 space-y-4">
                        <div>
                           <label className="text-xs font-semibold text-slate-500 block mb-1">API Key</label>
                           <Input 
                              type="password" 
                              value={configsGlobais['trello_api_key'] || ''} 
                              onChange={e => updateGlobal('trello_api_key', e.target.value)} 
                              className="font-mono text-sm h-8" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-slate-500 block mb-1">API Token</label>
                           <Input 
                              type="password" 
                              value={configsGlobais['trello_token'] || ''} 
                              onChange={e => updateGlobal('trello_token', e.target.value)} 
                              className="font-mono text-sm h-8" />
                        </div>
                        <div className="flex gap-2">
                           <Button variant="secondary" size="sm" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={testarTrello}>
                              Testar Conexão
                           </Button>
                           <Button variant="outline" size="sm" className="w-full" onClick={carregarQuadrosTrello}>
                              Selecionar Quadros
                           </Button>
                        </div>
                        
                        {trelloBoards.length > 0 && (
                           <div className="mt-4 pt-4 border-t border-slate-100">
                              <h4 className="text-xs font-bold text-slate-700 mb-2">Quadros Disponíveis</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                 {trelloBoards.map(board => {
                                    const ativosStr = configsGlobais.trello_boards_ativos;
                                    const isAtivo = ativosStr ? JSON.parse(ativosStr).includes(board.id) : false;
                                    return (
                                       <div key={board.id} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                          <Checkbox id={`board-${board.id}`} checked={isAtivo} onCheckedChange={(c) => toggleBoardTrello(board.id, !!c)} />
                                          <label htmlFor={`board-${board.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700">
                                             {board.name}
                                          </label>
                                       </div>
                                    )
                                 })}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2">Sincronização roda em background a cada 5 minutos buscando novos cards para a triagem.</p>
                           </div>
                        )}
                        {loadingBoards && <div className="text-center p-3 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Carregando quadros...</div>}
                     </CardContent>
                  </Card>

                  {/* Outros (Mocked structure for extensibility) */}
                  <Card className="border-slate-200 shadow-sm opacity-60">
                     <CardHeader className="pb-3">
                        <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                           Slack Webhooks (Em Breve)
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4 space-y-4">
                        <div>
                           <label className="text-xs font-semibold text-slate-500 block mb-1">Webhook URL</label>
                           <Input disabled placeholder="https://hooks.slack.com/services/..." className="text-sm h-8" />
                        </div>
                        <Button disabled variant="outline" size="sm" className="w-full">Testar Webhook</Button>
                     </CardContent>
                  </Card>
               </div>
            </TabsContent>

         </div>
      </Tabs>


      {/* Modal Adicionar Time */}
      <Dialog open={timeModal.open} onOpenChange={val => !val && setTimeModal({ ...timeModal, open: false })}>
         <DialogContent className="sm:max-w-xl w-[95vw]">
            <DialogHeader>
               <DialogTitle>Adicionar Novo Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                  <label className="text-sm font-medium text-slate-900 mb-1.5 block">Nome</label>
                  <Input value={timeModal.nome} onChange={e => setTimeModal({...timeModal, nome: e.target.value})} placeholder="Nome completo" />
               </div>
               <div>
                  <label className="text-sm font-medium text-slate-900 mb-1.5 block">E-mail (Login)</label>
                  <Input value={timeModal.email} onChange={e => setTimeModal({...timeModal, email: e.target.value})} type="email" placeholder="membro@arke.work" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-medium text-slate-900 mb-1.5 block">Função</label>
                     <Input value={timeModal.funcao} onChange={e => setTimeModal({...timeModal, funcao: e.target.value})} placeholder="Ex: Desenvolvedor" />
                  </div>
                  <div>
                     <label className="text-sm font-medium text-slate-900 mb-1.5 block">Nível de Acesso</label>
                     <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={timeModal.role} onChange={e => setTimeModal({...timeModal, role: e.target.value})}>
                        <option value="time">Time Regular</option>
                        <option value="admin">Administrador (Total)</option>
                     </select>
                  </div>
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setTimeModal({ ...timeModal, open: false })}>Cancelar</Button>
               <Button onClick={saveNovoMembro} className="bg-emerald-600 hover:bg-emerald-700">Criar Acesso</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Modal Result Senha Temp Time */}
      <Dialog open={timeResult.open} onOpenChange={val => !val && setTimeResult({ ...timeResult, open: false })}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="text-emerald-700">Conta Criada!</DialogTitle>
            </DialogHeader>
            <div className="bg-slate-50 border p-4 rounded-lg font-mono space-y-3">
               <div>
                  <strong className="block text-xs uppercase text-slate-500">Email</strong>
                  <Input readOnly value={timeResult.email} className="bg-white" />
               </div>
               <div>
                  <strong className="block text-xs uppercase text-slate-500">Senha Provisória</strong>
                  <Input readOnly value={timeResult.senha} className="bg-white font-bold" />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setTimeResult({ ...timeResult, open: false })}>Fechar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}
