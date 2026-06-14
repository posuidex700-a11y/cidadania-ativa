import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = ['Todos os Tipos', 'Descarte de Resíduos', 'Buraco/Calçada', 'Manutenção', 'Iluminação', 'Outros']

function getBadgeClass(status) {
  if (status === 'Resolvido') return 'badge badge-resolvido'
  if (status === 'Em Andamento') return 'badge badge-andamento'
  return 'badge badge-analise'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const hoje = new Date()
  const diff = Math.floor((hoje - d) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR')
}

export default function Acompanhar() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [filtro, setFiltro] = useState('Todos os Tipos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from('ocorrencias')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOcorrencias(data)
    setLoading(false)
  }

  const filtradas = filtro === 'Todos os Tipos'
    ? ocorrencias
    : ocorrencias.filter(o => o.tipo === filtro)

  const total = ocorrencias.length
  const emAnalise = ocorrencias.filter(o => o.status === 'Em Análise').length
  const emAndamento = ocorrencias.filter(o => o.status === 'Em Andamento').length
  const resolvidos = ocorrencias.filter(o => o.status === 'Resolvido').length

  return (
    <div className="page">
      <div className="header">
        <h1>Acompanhamento</h1>
        <p>Veja o status de todas as ocorrências</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value" style={{ color: '#1a1a2e' }}>{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Em Análise</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{emAnalise}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Em Andamento</div>
          <div className="stat-value" style={{ color: '#6366f1' }}>{emAndamento}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolvidos</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{resolvidos}</div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
          Filtrar por tipo
        </div>
        <div className="select-wrapper">
          <select value={filtro} onChange={e => setFiltro(e.target.value)}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="empty">Nenhuma ocorrência encontrada</div>
      ) : (
        <>
          <p className="list-count">{filtradas.length} Ocorrência{filtradas.length !== 1 ? 's' : ''}</p>
          {filtradas.map(o => (
            <div key={o.id} className="occurrence-item">
              <div className="occurrence-header">
                <strong>{o.tipo}</strong>
                <span className={getBadgeClass(o.status)}>{o.status}</span>
              </div>
              <div className="occurrence-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                </svg>
                {formatDate(o.created_at)}
              </div>
              {o.descricao && (
                <p className="occurrence-desc-link">{o.descricao}</p>
              )}
              {o.endereco && (
                <div className="occurrence-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {o.endereco}
                </div>
              )}
              <div className="progress-container">
                <div className="progress-label">
                  <span>Progresso</span>
                  <span>{o.progresso ?? 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${o.progresso ?? 0}%` }} />
                </div>
              </div>
              {o.foto_url && (
                <a href={o.foto_url} target="_blank" rel="noreferrer" className="foto-link">
                  📷 Ver foto
                </a>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
