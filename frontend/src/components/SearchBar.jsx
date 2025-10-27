import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function SearchBar({ compact = true }) {
  const [location, setLocation] = useState('')
  const [pickup, setPickup] = useState('')
  const [returnd, setReturnd] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams({ location, pickup, return: returnd })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={submit}
      className={`grid gap-3 lg:grid-cols-[1fr,220px,220px,140px] items-end`}
    >
      <div>
        <label className="text-sm text-slate-600">Địa điểm nhận xe</label>
        <input className="input" placeholder="Nhập địa điểm" value={location} onChange={e=>setLocation(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-slate-600">Ngày nhận xe</label>
        <input type="datetime-local" className="input" value={pickup} onChange={e=>setPickup(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-slate-600">Ngày trả xe</label>
        <input type="datetime-local" className="input" value={returnd} onChange={e=>setReturnd(e.target.value)} />
      </div>
      <button className="btn w-full" type="submit">Tìm kiếm xe</button>
    </form>
  )
}
