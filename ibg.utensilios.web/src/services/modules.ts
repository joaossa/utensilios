import { authApiRequest } from '@/services/api'

export type LookupOption = {
  id: number
  descricao: string
  ativo?: 'S' | 'N'
}

export type Item = {
  id: number
  codigo: string
  descricao: string
  categoria_id: number | null
  estado_id: number | null
  categoria: string | null
  estado: string | null
  localizacao: string | null
  quantidade_total: number
  quantidade_emprestada: number
  quantidade_disponivel: number
  data_cadastro: string
}

export type ItemPayload = {
  descricao: string
  categoria_id: number
  estado_id: number
  quantidade_total: number
  localizacao?: string | null
}

export type ItemFormOptions = {
  estados: LookupOption[]
  categorias: LookupOption[]
}

export type ItemImagem = {
  id: number
  item_id: number
  url_imagem: string | null
  descricao: string | null
  ordem: number | null
  nome_arquivo?: string | null
  mime_type?: string | null
  tamanho_bytes?: number | null
  possui_binario?: boolean
  imagem_src?: string | null
}

export type ItemImagemPayload = {
  item_id: number
  url_imagem?: string | null
  arquivo_base64?: string | null
  nome_arquivo?: string | null
  mime_type?: string | null
  tamanho_bytes?: number | null
  descricao?: string | null
  ordem?: number
}

export type Membro = {
  id: number
  nome: string
  telefone: string | null
  cpf: string | null
  email: string | null
  tipo: 'membro' | 'lideranca' | 'visitante_autorizado'
  ativo: boolean
  data_cadastro: string
}

export type MembroPayload = {
  nome: string
  telefone?: string | null
  cpf?: string | null
  email?: string | null
  tipo: Membro['tipo']
  ativo: boolean
}

export type Emprestimo = {
  id: number
  item_id: number
  membro_id: number
  quantidade: number
  data_retirada: string
  data_prevista_devolucao: string
  data_devolucao: string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  observacoes: string | null
  item_codigo?: string | null
  item_descricao?: string | null
  membro_nome?: string | null
}

export type EmprestimoPayload = {
  item_id: number
  membro_id: number
  quantidade: number
  data_prevista_devolucao: string
  observacoes?: string | null
}

export type Historico = {
  id: number
  item_id: number
  tipo_evento: 'emprestado' | 'devolvido' | 'manutencao' | 'cadastro' | 'atualizacao'
  descricao: string | null
  data_evento: string
  usuario_responsavel: string | null
  item_codigo?: string | null
  item_descricao?: string | null
}

export type HistoricoPayload = {
  item_id: number
  tipo_evento: Historico['tipo_evento']
  descricao?: string | null
  usuario_responsavel?: string | null
}

export function listItens() {
  return authApiRequest<Item[]>('/itens')
}

export function getItem(id: number) {
  return authApiRequest<Item>(`/itens/${id}`)
}

export function getItemFormOptions() {
  return authApiRequest<ItemFormOptions>('/itens/opcoes/formulario')
}

export function createItem(payload: ItemPayload) {
  return authApiRequest<Item>('/itens', { method: 'POST', body: payload })
}

export function updateItem(id: number, payload: Partial<ItemPayload>) {
  return authApiRequest<Item>(`/itens/${id}`, { method: 'PUT', body: payload })
}

export function deleteItem(id: number) {
  return authApiRequest<void>(`/itens/${id}`, { method: 'DELETE' })
}

export function listItemImagens(itemId: number) {
  return authApiRequest<ItemImagem[]>(`/item-imagens?item_id=${itemId}`)
}

export function createItemImagem(payload: ItemImagemPayload) {
  return authApiRequest<ItemImagem>('/item-imagens', { method: 'POST', body: payload })
}

export function updateItemImagem(id: number, payload: Partial<ItemImagemPayload>) {
  return authApiRequest<ItemImagem>(`/item-imagens/${id}`, { method: 'PUT', body: payload })
}

export function deleteItemImagem(id: number) {
  return authApiRequest<void>(`/item-imagens/${id}`, { method: 'DELETE' })
}

export function listMembros() {
  return authApiRequest<Membro[]>('/membros')
}

export function createMembro(payload: MembroPayload) {
  return authApiRequest<Membro>('/membros', { method: 'POST', body: payload })
}

export function updateMembro(id: number, payload: Partial<MembroPayload>) {
  return authApiRequest<Membro>(`/membros/${id}`, { method: 'PUT', body: payload })
}

export function deleteMembro(id: number) {
  return authApiRequest<void>(`/membros/${id}`, { method: 'DELETE' })
}

export function listEmprestimos() {
  return authApiRequest<Emprestimo[]>('/emprestimos')
}

export function createEmprestimo(payload: EmprestimoPayload) {
  return authApiRequest<Emprestimo>('/emprestimos', { method: 'POST', body: payload })
}

export function updateEmprestimo(id: number, payload: Partial<EmprestimoPayload>) {
  return authApiRequest<Emprestimo>(`/emprestimos/${id}`, { method: 'PUT', body: payload })
}

export function returnEmprestimo(id: number) {
  return authApiRequest<Emprestimo>(`/emprestimos/${id}/devolucao`, { method: 'POST' })
}

export function deleteEmprestimo(id: number) {
  return authApiRequest<void>(`/emprestimos/${id}`, { method: 'DELETE' })
}

export function listHistorico() {
  return authApiRequest<Historico[]>('/historico')
}

export function createHistorico(payload: HistoricoPayload) {
  return authApiRequest<Historico>('/historico', { method: 'POST', body: payload })
}

export function updateHistorico(id: number, payload: Partial<HistoricoPayload>) {
  return authApiRequest<Historico>(`/historico/${id}`, { method: 'PUT', body: payload })
}

export function deleteHistorico(id: number) {
  return authApiRequest<void>(`/historico/${id}`, { method: 'DELETE' })
}
