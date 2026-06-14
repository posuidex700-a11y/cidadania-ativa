import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = ['Descarte de Resíduos', 'Buraco/Calçada', 'Manutenção', 'Iluminação', 'Outros']

function getBadgeClass(status) {
  if (status === 'Resolvido') return 'badge badge-resolvido'
  if (status === 'Em Andamento') return 'badge badge-andamento'
  return 'badge badge-analise'
}

export default function Home() {
  const [tipo, setTipo] = useState(TIPOS[0])
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [localizacao, setLocalizacao] = useState(null)
  const [endereco, setEndereco] = useState('')
  const [geoLoading, setGeoLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [ocorrencias, setOcorrencias] = useState([])

  useEffect(() => {
    obterLocalizacao()
    carregarOcorrencias()
  }, [])

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      setEndereco('Geolocalização não suportada')
      setGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setLocalizacao({ latitude, longitude })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`
          )
          const data = await res.json()
          const a = data.address
          const parts = [
            a.road || a.pedestrian || a.suburb || a.neighbourhood,
            a.suburb || a.city_district || a.neighbourhood,
            a.state_district || a.city || 'DF'
          ].filter(Boolean)
          setEndereco(parts.slice(0, 2).join(', ') + ', DF')
        } catch {
          setEndereco(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        }
        setGeoLoading(false)
      },
      () => {
        setEndereco('Não foi possível obter localização')
        setGeoLoading(false)
      }
    )
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const carregarOcorrencias = async () => {
    const { data } = await supabase
      .from('ocorrencias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setOcorrencias(data)
  }

  const handleSubmit = async () => {
    if (!descricao.trim()) {
      alert('Por favor, descreva o problema.')
      return
    }
    setLoading(true)
    let foto_url = null

    if (foto) {
      const ext = foto.name.split('.').pop()
      const filename = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(filename, foto)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(filename)
        foto_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('ocorrencias').insert({
      tipo,
      descricao: descricao.trim(),
      foto_url,
      latitude: localizacao?.latitude ?? null,
      longitude: localizacao?.longitude ?? null,
      endereco: endereco || null,
      status: 'Em Análise',
      progresso: 0
    })

    setLoading(false)
    if (error) {
      alert('Erro ao enviar. Tente novamente.')
      return
    }
    setSucesso(true)
    setDescricao('')
    setFoto(null)
    setFotoPreview(null)
    setTimeout(() => setSucesso(false), 3000)
    carregarOcorrencias()
  }

  return (
    <div className="page">
      <div className="header">
        <h1>Cidadania Ativa</h1>
        <p>Registre problemas na sua cidade</p>
      </div>

      <div className="card">
        <h2>Nova Ocorrência</h2>

        {sucesso && (
          <div className="alert-success">Ocorrência enviada com sucesso!</div>
        )}

        <div className="form-group">
          <label>Tipo de Problema</label>
          <div className="select-wrapper">
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Descrição do Problema</label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva detalhadamente o problema encontrado..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Foto do Problema</label>
          <label className="foto-btn" htmlFor="foto-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            {foto ? foto.name.slice(0, 24) + '...' : 'Tirar Foto'}
          </label>
          <input
            id="foto-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            style={{ display: 'none' }}
          />
          {fotoPreview && (
            <img src={fotoPreview} alt="Prévia da foto" className="foto-preview" />
          )}
        </div>

        <div className="form-group">
          <label>Localização</label>
          <div className="location-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#6366f1" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>{geoLoading ? 'Obtendo localização...' : endereco}</span>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Enviando...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
              Enviar Registro
            </>
          )}
        </button>
      </div>

      <div className="section">
        <h2>Minhas Ocorrências</h2>
        {ocorrencias.length === 0 ? (
          <div className="empty">Nenhuma ocorrência registrada ainda</div>
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
            </div>
          ))
        )}
      </div>
    </div>
  )
}
