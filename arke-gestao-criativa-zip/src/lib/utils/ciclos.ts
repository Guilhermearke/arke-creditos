import { createCiclo, getCicloAtivo } from '../supabase/queries';

export async function verificarOuCriarCicloMesAtual(clienteId: string, contratoId: string, creditosMensais: number = 0) {
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  try {
    const cicloStr = await getCicloAtivo(clienteId, mes, ano);
    if (!cicloStr) {
      await createCiclo({
        cliente_id: clienteId,
        contrato_id: contratoId,
        mes,
        ano,
        creditos_disponiveis: creditosMensais,
      });
    }
  } catch (error) {
    console.error('Erro ao verificar ou criar ciclo:', error);
  }
}
