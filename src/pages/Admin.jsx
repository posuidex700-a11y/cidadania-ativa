import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIAS = ['Descarte de Resíduos', 'Buraco/Calçada', 'Manutenção', 'Iluminação', 'Outros']

function getBadgeClass(status) {
  if (status === 'Resolvido') return 'badge badge-resolvido'
  if (status === 'Em Andamento') return 'badge badge-andamento'
  return 'badge badge-analise'
}

export default function Admin() {
  const [ocorrencias, setOcorrencias] = useState([])
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

  const atualizarStatus = async (id, status) => {
    const progresso = status === 'Resolvido' ? 100 : status === 'Em Andamento' ? 50 : 0
    const { error } = await supabase
      .from('ocorrencias')
      .update({ status, progresso })
      .eq('id', id)
    if (!error) {
      setOcorrencias(prev =>
        prev.map(o => o.id === id ? { ...o, status, progresso } : o)
      )
    }
  }

  const total = ocorrencias.length
  const emAnalise = ocorrencias.filter(o => o.status === 'Em Análise').length
  const emAndamento = ocorrencias.filter(o => o.status === 'Em Andamento').length
  const resolvidos = ocorrencias.filter(o => o.status === 'Resolvido').length

  const comGeo = ocorrencias.filter(o => o.latitude && o.longitude)

  return (
    <div className="page">
      <div className="header">
        <h1>Painel Admin</h1>
        <p>Gerencie todas as ocorrências</p>
      </div>

      <div className="card">
        <div className="card-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
          Visão Geral
        </div>
        <div className="stats-inline">
          <div className="stat-inline">
            <span className="stat-num" style={{ color: '#1a1a2e' }}>{total}</span>
            <span className="stat-nm-label">Total</span>
          </div>
          <div className="stat-inline">
            <span className="stat-num" style={{ color: '#d97706' }}>{emAnalise}</span>
            <span className="stat-nm-label">Análise</span>
          </div>
          <div className="stat-inline">
            <span className="stat-num" style={{ color: '#6366f1' }}>{emAndamento}</span>
            <span className="stat-nm-label">Andamento</span>
          </div>
          <div className="stat-inline">
            <span className="stat-num" style={{ color: '#16a34a' }}>{resolvidos}</span>
            <span className="stat-nm-label">Resolvidos</span>
          </div>
        </div>
      </div>

      <div className="category-list">
        <h3>Problemas por Categoria</h3>
        {CATEGORIAS.map(cat => (
          <div key={cat} className="category-item">
            <span style={{ color: '#6366f1' }}>{cat}</span>
            <span style={{ fontWeight: 600 }}>
              {ocorrencias.filter(o => o.tipo === cat).length}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Mapa de Ocorrências
        </div>
        <div className="map-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#9ca3af">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span>Visualização do mapa</span>
          <small>{total} ponto{total !== 1 ? 's' : ''} marcado{total !== 1 ? 's' : ''}</small>
        </div>
        {comGeo.length > 0 && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${comGeo[0].latitude},${comGeo[0].longitude}`}
            target="_blank"
            rel="noreferrer"
            className="foto-link"
            style={{ display: 'block', textAlign: 'center', marginTop: 8 }}
          >
            Abrir área no Google Maps
          </a>
        )}
      </div>

      <div className="section">
        <h2>Gerenciar Ocorrências</h2>
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : ocorrencias.length === 0 ? (
          <div className="empty">Nenhuma ocorrência registrada</div>
        ) : (
          ocorrencias.map(o => (
            <div key={o.id} className="occurrence-item">
              <div className="occurrence-header">
                <strong>{o.tipo}</strong>
                <span className={getBadgeClass(o.status)}>{o.status}</span>
              </div>
              <p className="occurrence-desc">{o.descricao}</p>
              {o.endereco && (
                <div className="occurrence-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {o.endereco}
                </div>
              )}
              {o.foto_url && (
                <a href={o.foto_url} target="_blank" rel="noreferrer" className="foto-link">
                  📷 Ver foto
                </a>
              )}
              <div className="manage-buttons">
                <button
                  className="btn-sm btn-analise"
                  onClick={() => atualizarStatus(o.id, 'Em Análise')}
                  style={{ opacity: o.status === 'Em Análise' ? 0.4 : 1 }}
                >
                  Em Análise
                </button>
                <button
                  className="btn-sm btn-andamento"
                  onClick={() => atualizarStatus(o.id, 'Em Andamento')}
                  style={{ opacity: o.status === 'Em Andamento' ? 0.4 : 1 }}
                >
                  Em Andamento
                </button>
                <button
                  className="btn-sm btn-resolvido"
                  onClick={() => atualizarStatus(o.id, 'Resolvido')}
                  style={{ opacity: o.status === 'Resolvido' ? 0.4 : 1 }}
                >
                  Resolvido
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
