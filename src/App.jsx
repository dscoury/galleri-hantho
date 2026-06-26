import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Inventory from './components/Inventory'
import AddArtwork from './components/AddArtwork'
import RegisterSale from './components/RegisterSale'
import MonthlySales from './components/MonthlySales'

export default function App() {
  const [page, setPage] = useState('inventory')
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin() {
    setError('')
    setSigningIn(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Feil e-post eller passord')
    setSigningIn(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const nav = [
    { id: 'inventory', label: 'Inventar' },
    { id: 'add', label: 'Ny innlevering' },
    { id: 'sale', label: 'Registrer salg' },
    { id: 'monthly', label: 'Månedsrapport' },
  ]

  if (loading) return null

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-stone-200 p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold mb-1">Galleri Hantho</h1>
          <p className="text-stone-500 text-sm mb-6">Logg inn for å fortsette</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-500 mb-1">E-post</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-500 mb-1">Passord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={signingIn}
              className="w-full px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
            >
              {signingIn ? 'Logger inn...' : 'Logg inn'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Galleri Hantho</h1>
        <nav className="flex gap-2 items-center">
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === n.id
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {n.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            Logg ut
          </button>
        </nav>
      </header>
      <main className="max-w-screen-2xl mx-auto px-8 py-8">
        {page === 'inventory' && <Inventory />}
        {page === 'add' && <AddArtwork onSaved={() => setPage('inventory')} />}
        {page === 'sale' && <RegisterSale onSaved={() => setPage('inventory')} />}
        {page === 'monthly' && <MonthlySales />}
      </main>
    </div>
  )
}