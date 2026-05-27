import { supabase } from '@/lib/supabase/client';

export async function buscarCardsTrelloNovos() {
  try {
    // Buscar credenciais do banco
    const { data: configs } = await supabase
      .from('configuracoes_sistema')
      .select('id, valor')
      .in('id', ['trello_api_key', 'trello_token', 'trello_boards_ativos', 'trello_ultimo_sync']);
    
    if (!configs || configs.length === 0) return 0;

    const cfg = Object.fromEntries(configs.map(c => [c.id, c.valor]));
    if (!cfg.trello_api_key || !cfg.trello_token) return 0;
    
    const boards = cfg.trello_boards_ativos ? JSON.parse(cfg.trello_boards_ativos) : [];
    const ultimoSyncStr = cfg.trello_ultimo_sync;
    const ultimoSync = ultimoSyncStr ? new Date(ultimoSyncStr) : new Date(0);
    const novosCards = [];
    
    for (const boardId of boards) {
      if (!boardId) continue;
      const res = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${cfg.trello_api_key}&token=${cfg.trello_token}&filter=open`
      );
      if (!res.ok) continue;
      const cards = await res.json();
      
      for (const card of cards) {
        const timestamp = parseInt(card.id.substring(0, 8), 16) * 1000;
        const createdAt = new Date(timestamp);
        if (createdAt > ultimoSync) {
          novosCards.push({ card, boardId });
        }
      }
    }
    
    // Criar triagem_item para cada card novo
    for (const { card, boardId } of novosCards) {
      // Verificar se já existe um triagem_item com esse trello_card_id
      const { data: existing } = await supabase
        .from('triagem_itens') // Or 'tarefas', wait, the prompt says 'tarefas' but creates 'triagem_itens'. Let's check 'triagem_itens' first, or 'tarefas'.
        .select('id')
        .eq('dados_extras->>trello_card_id', card.id)
        .maybeSingle();
      
      if (!existing) {
        // Criar triagem_item
        await supabase.from('triagem_itens').insert({
          tipo: 'demanda',
          status_triagem: 'aguardando',
          canal: 'trello',
          canal_label: card.idBoard,
          conteudo_original: card.name + (card.desc ? '\n' + card.desc : ''),
          dados_extras: { trello_card_id: card.id, trello_card_url: card.url }
        });
      }
    }
    
    // Atualizar ultimo sync se houve cards ou sempre? O prompt diz atualizar sempre no final
    if (novosCards.length > 0) {
        await supabase.from('configuracoes_sistema').upsert({
        id: 'trello_ultimo_sync',
        valor: new Date().toISOString()
        });
    } else {
        await supabase.from('configuracoes_sistema').upsert({
        id: 'trello_ultimo_sync',
        valor: new Date().toISOString()
        });
    }
    
    return novosCards.length;
  } catch (err) {
    console.error('Erro no polling do Trello:', err);
    return 0;
  }
}
