import { useState } from 'react'
import { useAuth } from '../state/AuthContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    try {
      const res = await requestPasswordReset(identifier)
      setMsg(res?.message || 'Đã gửi hướng dẫn đặt lại mật khẩu.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Không gửi được yêu cầu')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Quên mật khẩu</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <input className="input" placeholder="Email hoặc SĐT" value={identifier}
               onChange={e=>setIdentifier(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {msg && <div className="text-green-600 text-sm">{msg}</div>}
        <button className="btn w-full" type="submit">Gửi yêu cầu</button>
      </form>
    </div>
  )
}
