import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('') // email hoặc phone
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try {
      await login(identifier, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Đăng nhập</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <input className="input" placeholder="Email hoặc SĐT" value={identifier}
               onChange={e=>setIdentifier(e.target.value)} />
        <input className="input" type="password" placeholder="Mật khẩu" value={password}
               onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn w-full" type="submit">Đăng nhập</button>
      </form>
      <div className="flex items-center justify-between mt-4 text-sm">
        <Link to="/register" className="text-primary">Tạo tài khoản</Link>
        <Link to="/forgot-password" className="text-primary">Quên mật khẩu?</Link>
      </div>
    </div>
  )
}
