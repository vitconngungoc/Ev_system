import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const [sp] = useSearchParams()
  const token = sp.get('token') || '' // token từ link email
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp'); return
    }
    try {
      const res = await resetPassword({ token, newPassword, confirmPassword })
      setMsg(res?.message || 'Đổi mật khẩu thành công')
      setTimeout(()=>navigate('/login'), 900)
    } catch (err) {
      setError(err?.response?.data?.message || 'Không đặt lại được mật khẩu')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Đặt lại mật khẩu</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <input className="input" type="password" placeholder="Mật khẩu mới"
               value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <input className="input" type="password" placeholder="Xác nhận mật khẩu mới"
               value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {msg && <div className="text-green-600 text-sm">{msg}</div>}
        <button className="btn w-full" type="submit">Đổi mật khẩu</button>
      </form>
    </div>
  )
}
