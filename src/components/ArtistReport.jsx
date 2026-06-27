import { useEffect, useState } from 'react'
import { supabase, formatDate } from '../lib/supabase'

export default function ArtistReport() {
  const [salg, setSalg] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetchSalg()
  }, [from, to])

  async function fetchSalg() {
    setLoading(true)
    let query = supabase
      .from('salg')
      .select('*, kunstverk(tittel, eksemplar, kunstnere(navn))')
      .order('salgsdato')

    if (from) query = query.gte('salgsdato', from)
    if (to)   query = query.lte('salgsdato', to + '-99')

    const { data } = await query
    setSalg(data || [])
    setLoading(false)
  }

  function currentMonth() {
    return new Date().toISOString().slice(0, 7)
  }

  function stepMonth(month, delta) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const byArtist = salg.reduce((acc, s) => {
    const navn = s.kunstverk?.kunstnere?.navn || 'Ukjent'
    if (!acc[navn]) acc[navn] = { navn, salg: [] }
    acc[navn].salg.push(s)
    return acc
  }, {})

  const artists = Object.values(byArtist).sort((a, b) => {
    const lastA = a.navn.trim().split(' ').pop().toLowerCase()
    const lastB = b.navn.trim().split(' ').pop().toLowerCase()
    return lastA.localeCompare(lastB, 'nb')
  })

  const grandTotal    = salg.reduce((s, r) => s + Number(r.salgspris), 0)
  const grandKunstner = salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
  const grandGalleri  = salg.reduce((s, r) => s + Number(r.galleri_andel), 0)

  function toggle(navn) {
    setExpanded(e => ({ ...e, [navn]: !e[navn] }))
  }

  const fmt = n => Number(n).toLocaleString('nb-NO') + ' kr'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">Kunstnerrapport</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Fra</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFrom(prev => stepMonth(prev || currentMonth(), -1))}
                className="px-2 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >←</button>
              <span className="text-sm font-medium w-28 text-center">
                {from ? formatDate(from + '-01').replace(/^\d+\//, '').replace('/', ' ') : 'Alle'}
              </span>
              <button
                onClick={() => setFrom(prev => stepMonth(prev || currentMonth(), 1))}
                className="px-2 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >→</button>
            </div>
            {from && (
              <button onClick={() => setFrom('')} className="text-xs text-stone-400 hover:text-stone-600">✕</button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Til</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTo(prev => stepMonth(prev || currentMonth(), -1))}
                className="px-2 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >←</button>
              <span className="text-sm font-medium w-28 text-center">
                {to ? formatDate(to + '-01').replace(/^\d+\//, '').replace('/', ' ') : 'Alle'}
              </span>
              <button
                onClick={() => setTo(prev => stepMonth(prev || currentMonth(), 1))}
                className="px-2 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >→</button>
            </div>
            {to && (
              <button onClick={() => setTo('')} className="text-xs text-stone-400 hover:text-stone-600">✕</button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Laster...</p>
      ) : salg.length === 0 ? (
        <p className="text-stone-400 text-sm">Ingen salg i valgt periode.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Totalt solgt', value: grandTotal },
              { label: 'Til kunstnere (60%)', value: grandKunstner },
              { label: 'Til galleriet (40%)', value: grandGalleri },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-stone-200 px-5 py-4">
                <p className="text-sm text-stone-500 mb-1">{label}</p>
                <p className="text-2xl font-semibold">{value.toLocaleString('nb-NO')} kr</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {['Kunstner', 'Antall salg', 'Totalt solgt', 'Kunstner (60%)', 'Galleri (40%)', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-stone-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {artists.map(artist => {
                  const total    = artist.salg.reduce((s, r) => s + Number(r.salgspris), 0)
                  const kunstner = artist.salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
                  const galleri  = artist.salg.reduce((s, r) => s + Number(r.galleri_andel), 0)
                  const isOpen   = expanded[artist.navn]
                  return (
                    <>
                      <tr
                        key={artist.navn}
                        className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
                        onClick={() => toggle(artist.navn)}
                      >
                        <td className="px-4 py-3 font-medium">{artist.navn}</td>
                        <td className="px-4 py-3 text-stone-500">{artist.salg.length}</td>
                        <td className="px-4 py-3">{fmt(total)}</td>
                        <td className="px-4 py-3">{fmt(kunstner)}</td>
                        <td className="px-4 py-3">{fmt(galleri)}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{isOpen ? '▲ Skjul' : '▼ Vis salg'}</td>
                      </tr>
                      {isOpen && artist.salg.map(s => (
                        <tr key={s.id} className="border-b border-stone-100 bg-stone-50/70">
                          <td className="px-4 py-2 pl-8 text-stone-500">
                            {s.kunstverk?.tittel}
                            {s.kunstverk?.eksemplar ? ` (${s.kunstverk.eksemplar})` : ''}
                          </td>
                          <td className="px-4 py-2 text-stone-400">{formatDate(s.salgsdato)}</td>
                          <td className="px-4 py-2">{fmt(s.salgspris)}</td>
                          <td className="px-4 py-2">{fmt(s.kunstner_andel)}</td>
                          <td className="px-4 py-2">{fmt(s.galleri_andel)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.utbetalt ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'
                            }`}>
                              {s.utbetalt ? 'Utbetalt' : 'Ikke utbetalt'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-stone-200 bg-stone-50">
                <tr>
                  <td className="px-4 py-3 font-semibold">Totalt</td>
                  <td className="px-4 py-3 text-stone-500">{salg.length}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(grandTotal)}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(grandKunstner)}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(grandGalleri)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}