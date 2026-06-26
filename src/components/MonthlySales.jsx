import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabase, formatDate } from '../lib/supabase'

export default function MonthlySales() {
  const [salg, setSalg] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth())

  function currentMonth() {
    return new Date().toISOString().slice(0, 7)
  }

  useEffect(() => {
    fetchSalg()
  }, [month])

  async function fetchSalg() {
    setLoading(true)
    const from = `${month}-01`
    const to = `${month}-31`
    const { data } = await supabase
      .from('salg')
      .select('*, kunstverk(tittel, eksemplar, kunstnere(navn))')
      .gte('salgsdato', from)
      .lte('salgsdato', to)
      .order('salgsdato')
    setSalg(data || [])
    setLoading(false)
  }

  async function toggleUtbetalt(id, current) {
    await supabase
      .from('salg')
      .update({ utbetalt: !current, utbetalt_dato: !current ? new Date().toISOString().split('T')[0] : null })
      .eq('id', id)
    fetchSalg()
  }

  const totalSalg = salg.reduce((s, r) => s + Number(r.salgspris), 0)
  const totalKunstner = salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
  const totalGalleri = salg.reduce((s, r) => s + Number(r.galleri_andel), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Månedsrapport</h2>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </div>

      {salg.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Totalt solgt', value: totalSalg },
            { label: 'Til kunstnere (60%)', value: totalKunstner },
            { label: 'Til galleriet (40%)', value: totalGalleri },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-stone-200 px-5 py-4">
              <p className="text-sm text-stone-500 mb-1">{label}</p>
              <p className="text-2xl font-semibold">{value.toLocaleString('nb-NO')} kr</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-stone-400 text-sm">Laster...</p>
      ) : salg.length === 0 ? (
        <p className="text-stone-400 text-sm">Ingen salg registrert denne måneden.</p>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['Dato', 'Verk', 'Kunstner', 'Salgspris', 'Kunstner (60%)', 'Galleri (40%)', 'Utbetalt'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salg.map(s => (
                <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-500">
                    {formatDate(s.salgsdato)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {s.kunstverk?.tittel}
                    {s.kunstverk?.eksemplar ? ` (${s.kunstverk.eksemplar})` : ''}
                  </td>
                  <td className="px-4 py-3">{s.kunstverk?.kunstnere?.navn}</td>
                  <td className="px-4 py-3">{Number(s.salgspris).toLocaleString('nb-NO')} kr</td>
                  <td className="px-4 py-3">{Number(s.kunstner_andel).toLocaleString('nb-NO')} kr</td>
                  <td className="px-4 py-3">{Number(s.galleri_andel).toLocaleString('nb-NO')} kr</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUtbetalt(s.id, s.utbetalt)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.utbetalt
                          ? 'bg-green-100 text-green-800'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {s.utbetalt ? 'Utbetalt' : 'Ikke utbetalt'}
                    </button>
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