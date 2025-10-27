import { useEffect, useState } from 'react'
import api from '../api/apiClient'

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/bookings')
        setItems(Array.isArray(data) ? data : data?.items || [])
      } catch (err) {
        setMsg(err?.response?.data?.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cancel = async (id) => {
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`)
      setMsg(data?.message || 'Booking cancelled')
      setItems(prev => prev.map(i => i.id===id ? {...i, status:'CANCELLED'} : i))
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Cancel failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-6">My rentals</h1>
      {msg && <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 mb-4">{msg}</div>}
      {loading ? 'Loading...' : (
        <div className="space-y-4">
          {items.length === 0 && <div className="text-slate-500">You have no rentals yet.</div>}
          {items.map(b => (
            <div key={b.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{b.vehicleModel || b.vehicleName}</div>
                <div className="text-sm text-slate-500">
                  {b.pickupDate} {'→'} {b.returnDate}
                </div>

                <div className="text-xs text-slate-500">Status: {b.status}</div>
              </div>
              {b.status === 'BOOKED' && (
                <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={()=>cancel(b.id)}>Cancel</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
