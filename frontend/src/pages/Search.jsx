import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/apiClient'
import VehicleCard from '../components/VehicleCard'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../state/AuthContext'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function Search() {
  const q = useQuery()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const { token } = useAuth()

  const filters = {
    location: q.get('location') || '',
    pickup: q.get('pickup') || '',
    returnd: q.get('return') || ''
  }

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/vehicles', { params: { location: filters.location, pickup: filters.pickup, returnDate: filters.returnd }})
        setVehicles(Array.isArray(data) ? data : data?.items || [])
      } catch (err) {
        setMessage(err?.response?.data?.message || 'Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }
    fetchVehicles()
  }, [filters.location, filters.pickup, filters.returnd])

  const book = async (v) => {
    if (!token) {
      setMessage('Please sign in to book a vehicle.')
      return
    }
    try {
      const payload = { vehicleId: v.id || v.vehicleId, pickupDate: filters.pickup, returnDate: filters.returnd }
      const { data } = await api.post('/bookings', payload)
      setMessage(data?.message || 'Booked successfully! Check your dashboard.')
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Booking failed')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <SearchBar />
      {message && <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800">{message}</div>}
      {loading ? <div>Loading vehicles...</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v, idx)=>(<VehicleCard key={idx} v={v} onBook={book} />))}
        </div>
      )}
    </div>
  )
}
