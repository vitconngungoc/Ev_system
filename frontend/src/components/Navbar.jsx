import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const active = ({ isActive }) => isActive ? "text-white font-semibold" : "text-white/70 hover:text-white"

  return (
    <header className="sticky top-0 z-30 bg-[#151E2E]/95 backdrop-blur">
      <div className="container py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center">
            <span className="text-primary font-black text-sm">EV</span>
          </div>
          <span className="font-extrabold text-xl text-white">EVolve</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={active}>Trang chủ</NavLink>
          <NavLink to="/search" className={active}>Xe điện</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {!token ? (
            <>
              <Link to="/login" className="btn-ghost">Đăng nhập</Link>
              <Link to="/register" className="btn">Đăng ký</Link>
            </>
          ) : (
            <>
              <span className="hidden sm:block text-white/80">Hi, {user?.fullName || user?.email}</span>
              <button className="btn-ghost" onClick={()=>{logout(); navigate('/')}}>Đăng xuất</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
