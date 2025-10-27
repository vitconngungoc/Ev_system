export default function VehicleCard({ v, onBook }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <img src={v.imageUrl || 'https://via.placeholder.com/640x360?text=EV'} alt={v.model} className="rounded-xl aspect-video object-cover" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg">{v.model || v.name}</h3>
          <p className="text-slate-500 text-sm">{v.stationName || 'EV Station'}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold">${v.pricePerHour || v.price || 10}/h</div>
          <div className="text-slate-500 text-xs">Status: {v.status || 'AVAILABLE'}</div>
        </div>
      </div>
      <button className="btn w-full" onClick={()=>onBook(v)}>Book</button>
    </div>
  )
}
