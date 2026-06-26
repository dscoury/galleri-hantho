import { useState } from 'react'
import Inventory from './components/Inventory'
import AddArtwork from './components/AddArtwork'
import RegisterSale from './components/RegisterSale'
import MonthlySales from './components/MonthlySales'

export default function App() {
  const [page, setPage] = useState('inventory')

  const nav = [
    { id: 'inventory', label: 'Inventar' },
    { id: 'add', label: 'Ny innlevering' },
    { id: 'sale', label: 'Registrer salg' },
    { id: 'monthly', label: 'Månedsrapport' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Galleri Hantho</h1>
        <nav className="flex gap-2">
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
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {page === 'inventory' && <Inventory />}
        {page === 'add' && <AddArtwork onSaved={() => setPage('inventory')} />}
        {page === 'sale' && <RegisterSale onSaved={() => setPage('inventory')} />}
        {page === 'monthly' && <MonthlySales />}
      </main>
    </div>
  )
}