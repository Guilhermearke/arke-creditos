// @ts-nocheck
import { createDelivery } from '@/app/actions'
import type { Cliente, Profile, Servico } from '@/lib/types'

export function RichTaskForm({
  clientes,
  servicos,
  team,
}: {
  clientes: Cliente[]
  servicos: Servico[]
  team: Profile[]
}) {
  return (
    <form action={createDelivery} className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--soft)] p-4">
        <p className="text-sm font-black">Identificação da demanda</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Cliente, serviço, responsável e SLA ficam no topo para o time saber o tamanho real da tarefa antes de abrir o briefing.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Cliente">
          <select name="cliente_id" required>
            <option value="">Selecione</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de serviço">
          <select name="servico_id" required>
            <option value="">Selecione</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome} · {servico.creditos} cr · {servico.categoria}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nome da tarefa">
          <input name="nome" placeholder="Ex: Vídeo campanha institucional" required />
        </Field>

        <Field label="Responsável">
          <select name="responsavel_id">
            <option value="">Sem responsável</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Prioridade">
          <select name="prioridade" defaultValue="media">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </Field>

        <Field label="Prazo ideal">
          <input name="prazo" type="date" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Formato">
          <input name="formato" placeholder="Ex: 1080x1920, 1:1, PDF A4" />
        </Field>

        <Field label="Canais">
          <input name="canais" placeholder="Instagram, LinkedIn, WhatsApp" />
        </Field>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Field label="Objetivo da demanda">
          <textarea name="objetivo" placeholder="O que essa entrega precisa resolver para o cliente? Qual decisão ou ação ela deve destravar?" />
        </Field>

        <Field label="Briefing de execução">
          <textarea name="briefing" placeholder="Contexto, mensagem principal, tom, pontos obrigatórios, restrições, aprovações necessárias." />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Referências">
          <textarea name="referencias" placeholder="Links, marcas, campanhas, exemplos visuais." />
        </Field>
        <Field label="Arquivos e materiais">
          <textarea name="arquivos" placeholder="Links de Drive, Figma, fotos, logos, textos e materiais recebidos." />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Link do briefing">
          <input name="link_briefing" placeholder="https://..." />
        </Field>
        <Field label="Checklist inicial">
          <input name="checklist" placeholder="Roteiro aprovado; Identidade recebida; Exportar vertical" />
        </Field>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-4 text-sm font-bold">
        <input name="revisao" type="checkbox" className="h-4 w-4 accent-[var(--foreground)]" />
        <span>
          É revisão
          <span className="ml-2 text-[var(--muted)]">+20% dos créditos do serviço</span>
        </span>
      </label>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--soft)] p-4">
        <p className="text-sm font-black">Ao confirmar</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          A tarefa entra como pendente no Kanban, debita os créditos do ciclo ativo e registra o histórico financeiro.
        </p>
      </div>

      <button className="rounded-lg bg-[var(--foreground)] px-5 py-3 text-sm font-black text-white transition hover:opacity-90" type="submit">
        Criar tarefa e enviar para Kanban
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black">{label}</span>
      <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-white [&_input]:px-3 [&_input]:py-3 [&_input]:outline-none [&_input]:transition [&_input]:focus:border-[var(--accent)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)] [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[var(--line)] [&_select]:bg-white [&_select]:px-3 [&_select]:py-3 [&_select]:outline-none [&_select]:transition [&_select]:focus:border-[var(--accent)] [&_select]:focus:ring-2 [&_select]:focus:ring-[var(--accent-soft)] [&_textarea]:min-h-32 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[var(--line)] [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-3 [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:focus:border-[var(--accent)] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}
