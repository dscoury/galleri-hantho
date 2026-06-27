import { useEffect, useState } from 'react'
import { supabase, formatDate } from '../lib/supabase'

const TYPES = ['Grafikk', 'Original på papir', 'Maleri', 'Keramikk', 'Glasskunst']

export default function AddArtwork({ onSaved }) {
  const [kunstnere, setKunstnere] = useState([])
  const [kunstner_id, setKunstner_id] = useState('')
  const [newKunstner, setNewKunstner] = useState('')
  const [addingKunstner, setAddingKunstner] = useState(false)
  const [rows, setRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [mottatt_dato, setMottatt_dato] = useState(today())

  function today() {
    return new Date().toISOString().slice(0, 7) // YYYY-MM
  }

  function emptyRow() {
    return { tittel: '', eksemplar: '', type: 'Grafikk', teknikk: '', pris: '' }
  }

  useEffect(() => {
    supabase.from('kunstnere').select('id, navn')
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => {
          const lastA = a.navn.trim().split(' ').pop().toLowerCase()
          const lastB = b.navn.trim().split(' ').pop().toLowerCase()
          return lastA.localeCompare(lastB, 'nb')
        })
        setKunstnere(sorted)
      })
  }, [])

  function updateRow(i, field, value) {
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function addRow() {
    setRows([...rows, emptyRow()])
  }

  function removeRow(i) {
    setRows(rows.filter((_, idx) => idx !== i))
  }

  async function saveKunstner() {
    if (!newKunstner.trim()) return
    const { data } = await supabase
      .from('kunstnere')
      .insert({ navn: newKunstner.trim() })
      .select()
      .single()
    setKunstnere([...kunstnere, data])
    setKunstner_id(data.id)
    setNewKunstner('')
    setAddingKunstner(false)
  }

  async function handleSubmit() {
    if (!kunstner_id) return alert('Velg en kunstner')
    if (rows.some(r => !r.tittel || !r.pris)) return alert('Fyll inn tittel og pris på alle verk')
    setSaving(true)
    const inserts = rows.map(r => ({
      kunstner_id,
      tittel: r.tittel,
      eksemplar: r.eksemplar || null,
      type: r.type,
      teknikk: r.teknikk || null,
      pris: Number(r.pris),
      mottatt_dato,
      status: 'Tilgjengelig',
    }))
    const { error } = await supabase.from('kunstverk').insert(inserts)
    setSaving(false)
    if (error) return alert('Feil: ' + error.message)
    onSaved()
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold mb-6">Ny innlevering</h2>

      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h3 className="font-medium mb-4">Kunstner og dato</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-stone-500 mb-1">Kunstner</label>
            {addingKunstner ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newKunstner}
                  onChange={e => setNewKunstner(e.target.value)}
                  placeholder="Navn på kunstner"
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <button onClick={saveKunstner} className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm">Lagre</button>
                <button onClick={() => setAddingKunstner(false)} className="px-3 py-2 border border-stone-200 rounded-lg text-sm">Avbryt</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={kunstner_id}
                  onChange={e => setKunstner_id(e.target.value)}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">Velg kunstner...</option>
                  {kunstnere.map(k => <option key={k.id} value={k.id}>{k.navn}</option>)}
                </select>
                <button onClick={() => setAddingKunstner(true)} className="px-3 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-50">+ Ny</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-stone-500 mb-1">Mottatt</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = mottatt_dato.split('-').map(Number)
                  const d = new Date(y, m - 2)
                  setMottatt_dato(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                }}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >
                ←
              </button>
              <span className="text-sm font-medium w-32 text-center">
                {formatDate(mottatt_dato + '-01').replace(/^\d+\//, '').replace('/', ' ')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const [y, m] = mottatt_dato.split('-').map(Number)
                  const d = new Date(y, m)
                  setMottatt_dato(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                }}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-100"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h3 className="font-medium mb-4">Kunstverk</h3>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-3 items-start flex-wrap">
              <input
                placeholder="Tittel *"
                value={row.tittel}
                onChange={e => updateRow(i, 'tittel', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Eksemplar (f.eks. 3/30)"
                value={row.eksemplar}
                onChange={e => updateRow(i, 'eksemplar', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <select
                value={row.type}
                onChange={e => updateRow(i, 'type', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input
                placeholder="Pris (kr) *"
                type="number"
                value={row.pris}
                onChange={e => updateRow(i, 'pris', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-stone-300 hover:text-red-400 text-lg leading-none mt-2">×</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addRow} className="mt-4 text-sm text-stone-500 hover:text-stone-800 underline">
          + Legg til verk
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-6 py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50"
      >
        {saving ? 'Lagrer...' : 'Lagre innlevering'}
      </button>
    </div>
  )
}