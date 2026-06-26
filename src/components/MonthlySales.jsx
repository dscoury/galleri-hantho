import { useEffect, useState } from 'react'
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
    const [year, monthIndex] = month.split('-').map(Number)
    const to = new Date(year, monthIndex, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('salg')
      .select('*, kunstverk(tittel, eksemplar, kunstnere(navn, epost, kontonr))')
      .gte('salgsdato', from)
      .lte('salgsdato', to)
      .order('salgsdato')
    setSalg(data || [])
    setLoading(false)
  }

  async function toggleUtbetalt(id, current) {
    await supabase
      .from('salg')
      .update({
        utbetalt: !current,
        utbetalt_dato: !current ? new Date().toISOString().slice(0, 7) : null
      })
      .eq('id', id)
    fetchSalg()
  }

  const totalSalg = salg.reduce((s, r) => s + Number(r.salgspris), 0)
  const totalKunstner = salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
  const totalGalleri = salg.reduce((s, r) => s + Number(r.galleri_andel), 0)

  // Group sales by artist for payout summaries
  const byArtist = salg.reduce((acc, s) => {
    const navn = s.kunstverk?.kunstnere?.navn
    if (!navn) return acc
    if (!acc[navn]) {
      acc[navn] = {
        navn,
        epost: s.kunstverk?.kunstnere?.epost,
        kontonr: s.kunstverk?.kunstnere?.kontonr,
        salg: []
      }
    }
    acc[navn].salg.push(s)
    return acc
  }, {})

  const monthLabel = formatDate(month + '-01').replace(/^\d+\//, '').replace('/', ' ')

  function printArtist(artist) {
    const win = window.open('', '_blank')
    const rows = artist.salg.map(s => `
      <tr>
        <td>${s.kunstverk?.tittel}${s.kunstverk?.eksemplar ? ' ' + s.kunstverk.eksemplar : ''}</td>
        <td style="text-align:right">${Number(s.salgspris).toLocaleString('nb-NO')} kr</td>
        <td style="text-align:right">${Number(s.kunstner_andel).toLocaleString('nb-NO')} kr</td>
      </tr>
    `).join('')
    const total = artist.salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
    win.document.write(`
      <html><head><title>Salgsoppgjør – ${artist.navn}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #222; }
        h2 { margin-bottom: 4px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; border-bottom: 2px solid #222; padding: 8px 0; font-size: 14px; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        td:not(:first-child) { text-align: right; }
        .total { font-weight: bold; font-size: 16px; text-align: right; margin-top: 8px; }
        .footer { margin-top: 32px; font-size: 13px; color: #666; }
      </style></head><body>
      <h2>Salgsoppgjør – ${artist.navn}</h2>
      <div class="meta">
        ${month.split('-')[1]}/${month.split('-')[0]}<br>
        ${artist.epost ? 'E-post: ' + artist.epost + '<br>' : ''}
        ${artist.kontonr ? 'Kontonummer: ' + artist.kontonr : ''}
      </div>
      <table>
        <thead><tr>
          <th>Verk</th>
          <th style="text-align:right">Salgspris</th>
          <th style="text-align:right">Din andel (60%)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Totalt til utbetaling: ${total.toLocaleString('nb-NO')} kr</div>
      <div class="footer">Galleri Hantho AS – Kunstverkene selges på vegne av kunstneren</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Månedsrapport</h2>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700"
          >
            Skriv ut
          </button>
        </div>
      </div>

      {salg.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
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
        <>
          {/* Full sales table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden mb-10">
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
                    <td className="px-4 py-3 text-stone-500">{formatDate(s.salgsdato)}</td>
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

          {/* Per-artist payout summaries */}
          <h3 className="text-lg font-semibold mb-4">Salgsoppgjør per kunstner</h3>
          <div className="space-y-4">
            {Object.values(byArtist).map(artist => {
              const artistTotal = artist.salg.reduce((s, r) => s + Number(r.kunstner_andel), 0)
              return (
                <div key={artist.navn} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <div>
                      <p className="font-semibold">{artist.navn}</p>
                      <p className="text-sm text-stone-400">
                        {artist.epost || <span className="text-amber-500">E-post mangler</span>}
                        {artist.kontonr
                          ? <span className="ml-3">{artist.kontonr}</span>
                          : <span className="ml-3 text-amber-500">Kontonr mangler</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => printArtist(artist)}
                      className="px-4 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-50"
                    >
                      Skriv ut oppgjør
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="text-left px-6 py-2 text-stone-500 font-medium">Verk</th>
                        <th className="text-right px-6 py-2 text-stone-500 font-medium">Salgspris</th>
                        <th className="text-right px-6 py-2 text-stone-500 font-medium">Din andel (60%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artist.salg.map(s => (
                        <tr key={s.id} className="border-t border-stone-100">
                          <td className="px-6 py-3">
                            {s.kunstverk?.tittel}
                            {s.kunstverk?.eksemplar ? ` ${s.kunstverk.eksemplar}` : ''}
                          </td>
                          <td className="px-6 py-3 text-right text-stone-500">
                            {Number(s.salgspris).toLocaleString('nb-NO')} kr
                          </td>
                          <td className="px-6 py-3 text-right font-medium">
                            {Number(s.kunstner_andel).toLocaleString('nb-NO')} kr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-stone-200">
                        <td className="px-6 py-3 font-semibold">Totalt til utbetaling</td>
                        <td></td>
                        <td className="px-6 py-3 text-right font-semibold text-lg">
                          {artistTotal.toLocaleString('nb-NO')} kr
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}