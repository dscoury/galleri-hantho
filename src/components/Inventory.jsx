import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabase, formatDate } from '../lib/supabase'

const STATUS_COLORS = {
  Tilgjengelig: 'bg-green-100 text-green-800',
  Reservert: 'bg-yellow-100 text-yellow-800',
  Solgt: 'bg-red-100 text-red-800',
  Returnert: 'bg-stone-100 text-stone-600',
}

export default function Inventory() {
  const [verk, setVerk] = useState([])
  const [filter, setFilter] = useState('Alle')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVerk()
  }, [])

  async function fetchVerk() {
    setLoading(true)
    const { data, error } = await supabase
      .from('kunstverk')
      .select('*, kunstnere(navn)')
      .order('created_at', { ascending: false })
    if (!error) setVerk(data)
    setLoading(false)
  }

  async function handleReturn(id) {
    const dato = prompt('Returdato (ÅÅÅÅ-MM-DD):')
    if (!dato) return
    await supabase
      .from('kunstverk')
      .update({ status: 'Returnert', retur_dato: dato })
      .eq('id', id)
    fetchVerk()
  }

  const statuses = ['Alle', 'Tilgjengelig', 'Reservert', 'Solgt', 'Returnert']

  const filtered = verk.filter(v => {
    const matchStatus = filter === 'Alle' || v.status === filter
    const matchSearch =
      v.tittel.toLowerCase().includes(search.toLowerCase()) ||
      v.kunstnere?.navn.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Inventar</h2>
        <span className="text-stone-500 text-sm">{filtered.length} verk</span>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Søk etter tittel eller kunstner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-stone-200 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <div className="flex gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Laster...</p>
      ) : filtered.length === 0 ? (
        <p className="text-stone-400 text-sm">Ingen verk funnet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['Tittel', 'Eksemplar', 'Kunstner', 'Type', 'Pris', 'Status', 'Mottatt', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} className={`border-b border-stone-100 hover:bg-stone-50 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
                  <td className="px-4 py-3 font-medium">{v.tittel}</td>
                  <td className="px-4 py-3 text-stone-500">{v.eksemplar || '—'}</td>
                  <td className="px-4 py-3">{v.kunstnere?.navn}</td>
                  <td className="px-4 py-3 text-stone-500">{v.type}</td>
                  <td className="px-4 py-3">{v.pris.toLocaleString('nb-NO')} kr</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {formatDate(v.mottatt_dato)}
                  </td>
                  <td className="px-4 py-3">
                    {v.status === 'Tilgjengelig' && (
                      <button
                        onClick={() => handleReturn(v.id)}
                        className="text-xs text-stone-400 hover:text-stone-700 underline"
                      >
                        Returner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}