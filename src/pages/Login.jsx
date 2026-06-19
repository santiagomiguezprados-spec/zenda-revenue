import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import ZendaLogo from '../components/ZendaLogo'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Si Supabase no está configurado, ir directo al dashboard
  useEffect(() => {
    if (!isSupabaseConfigured) navigate('/', { replace: true })
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured || !supabase) {
      navigate('/')
      return
    }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email o contraseña incorrectos.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <ZendaLogo size="lg" variant="color" />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-[#0A0A0B] text-center">Iniciar sesión</h1>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0A0A0B]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@zenda.com.ar"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#59D7A2] transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0A0A0B]">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#59D7A2] transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#59D7A2] hover:bg-[#3ec88e] text-[#0A0A0B] font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
