import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RegisterSale({ onSaved }) {
  const [verk, setVerk] = useState([])
  const [selected, setSelected] = useState(null)
  const [salgsdato, setSalgsdato] = useState(today())
  const [salgspris, setSalgspris] = useState('')
  const [fakturanr, setFakturanr] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  function today() {
    return new Date().toISOString().slice(0, 7) // YYYY-MM
  }

  useEffect(() => {
    supabase
      .from('kunstverk')
      .select('id, tittel, eksemplar, pris, kunstnere(navn)')
      .eq('status', 'Tilgjengelig')
      .order('tittel')
      .then(({ data }) => setVerk(data || []))
  }, [])

  const filtered = verk.filter(v =>
    v.tittel.toLowerCase().includes(search.toLowerCase()) ||
    v.kunstnere?.navn.toLowerCase().includes(search.toLowerCase())
  )

  function selectVerk(v) {
    setSelected(v)
    setSalgspris(String(v.pris))
  }

  async function handleSubmit() {
    if (!selected) return alert('Velg et kunstverk')
    if (!salgspris) return alert('Fyll inn salgspris')
    setSaving(true)
    const { error: salgError } = await supabase.from('salg').insert({
      kunstverk_id: selected.id,
      salgsdato,
      salgspris: Number(salgspris),
      fakturanr: fakturanr || null,
    })
    if (salgError) { setSaving(false); return alert('Feil: ' + salgError.message) }
    await supabase.from('kunstverk').update({ status: 'Solgt' }).eq('id', selected.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold mb-6">Registrer salg</h2>

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">

        <div>
          <label className="block text-sm text-stone-500 mb-1">Søk etter kunstverk</label>
          <input
            type="text"
            placeholder="Tittel eller kunstner..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null) }}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-500 mb-1">Velg kunstverk</label>
          <div className="border border-stone-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-stone-400">Ingen tilgjengelige verk funnet</p>
            ) : (
              filtered.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVerk(v)}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-stone-100 last:border-0 transition-colors ${
                    selected?.id === v.id
                      ? 'bg-stone-800 text-white'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  <span className="font-medium">{v.tittel}</span>
                  {v.eksemplar && <span className="ml-1 opacity-70">({v.eksemplar})</span>}
                  <span className="ml-2 opacity-70">— {v.kunstnere?.navn}</span>
                  <span className="float-right opacity-70">{Number(v.pris).toLocaleString('nb-NO')} kr</span>
                </button>
              ))
            )}
          </div>
        </div>

        {selected && (
          <div className="bg-stone-50 rounded-lg px-4 py-3 text-sm text-stone-600">
            Valgt: <span className="font-medium">{selected.tittel}{selected.eksemplar ? ` (${selected.eksemplar})` : ''}</span>
          </div>
        )}

        <div>
          <label className="block text-sm text-stone-500 mb-1">Salgspris (kr)</label>
          <input
            type="number"
            value={salgspris}
            onChange={e => setSalgspris(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {salgspris && (
          <div className="bg-stone-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Kunstner (60%)</span>
              <span className="font-medium">{(Number(salgspris) * 0.6).toLocaleString('nb-NO')} kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Galleri (40%)</span>
              <span className="font-medium">{(Number(salgspris) * 0.4).toLocaleString('nb-NO')} kr</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-stone-500 mb-1">Salgsmåned</label>
          <input
            type="month"
            value={salgsdato}
            onChange={e => setSalgsdato(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-500 mb-1">Fakturanr (valgfritt)</label>
          <input
            type="text"
            value={fakturanr}
            onChange={e => setFakturanr(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full px-6 py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50"
        >
          {saving ? 'Lagrer...' : 'Registrer salg'}
        </button>
      </div>
    </div>
  )
}