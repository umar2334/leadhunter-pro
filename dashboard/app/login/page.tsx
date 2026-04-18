'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess('Check your email to confirm your account, then log in.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f4f5f8 0%, #eef0f8 100%)' }}>
      <div style={{ width: 380, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(99,102,241,0.12)', padding: '36px 32px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>🎯</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a202c', letterSpacing: -0.3 }}>LeadHunter Pro</div>
            <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500 }}>Lead Generation Dashboard</div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a202c', marginBottom: 4 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ fontSize: 13, color: '#718096', marginBottom: 24 }}>
          {mode === 'login' ? 'Sign in to your account to continue.' : 'Sign up to start capturing leads.'}
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f4f5f8', borderRadius: 9, padding: 3, marginBottom: 22, gap: 3 }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#6366f1' : '#718096', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 5 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8eaf0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a202c', background: '#fafbfc', transition: 'border 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e8eaf0'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 5 }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8eaf0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a202c', background: '#fafbfc', transition: 'border 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e8eaf0'}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? '#e8eaf0' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: loading ? '#a0aec0' : '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.3)', marginTop: 2 }}>
            {loading && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#a0aec0', marginTop: 20 }}>
          Secure login powered by Supabase Auth
        </p>
      </div>
    </div>
  );
}
