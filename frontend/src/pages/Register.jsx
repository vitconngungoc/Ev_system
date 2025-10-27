import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    fullName:'', email:'', phone:'', password:'', confirmPassword:'', agreedToTerms:true
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp'); return
    }
    try {
      const res = await register(form)
      setMsg(res?.message || 'Tạo tài khoản thành công. Vui lòng đăng nhập.')
      setTimeout(()=>navigate('/login'), 900)
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Đăng ký</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <input className="input" placeholder="Họ và tên" value={form.fullName}
               onChange={e=>setForm({...form, fullName:e.target.value})} />
        <input className="input" placeholder="Email" value={form.email}
               onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="input" placeholder="Số điện thoại" value={form.phone}
               onChange={e=>setForm({...form, phone:e.target.value})} />
        <input className="input" type="password" placeholder="Mật khẩu" value={form.password}
               onChange={e=>setForm({...form, password:e.target.value})} />
        <input className="input" type="password" placeholder="Xác nhận mật khẩu" value={form.confirmPassword}
               onChange={e=>setForm({...form, confirmPassword:e.target.value})} />

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-1" checked={form.agreedToTerms}
                 onChange={e=>setForm({...form, agreedToTerms:e.target.checked})} />
          Tôi đồng ý với Điều khoản sử dụng & Chính sách bảo mật
        </label>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {msg && <div className="text-green-600 text-sm">{msg}</div>}
        <button className="btn w-full" type="submit">Tạo tài khoản</button>
      </form>
      <p className="mt-4 text-sm">Đã có tài khoản? <Link to="/login" className="text-primary">Đăng nhập</Link></p>
    </div>
  )
}
