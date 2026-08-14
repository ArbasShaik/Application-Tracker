import React, { useState } from 'react';

export default function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const url = `http://localhost:5000/api/auth/${isLogin ? 'login' : 'register'}`;
    const body = isLogin ? { email: form.email, password: form.password } : form;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    onAuth(data.token, data.name);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🗂 Job Tracker</h2>
        <p style={styles.sub}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={styles.group}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          <button style={styles.btn} type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:   { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'Arial, sans-serif' },
  card:   { background: '#fff', padding: 36, borderRadius: 12, width: 380, maxWidth: '95%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  title:  { textAlign: 'center', marginBottom: 4, fontSize: 22 },
  sub:    { textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 20 },
  group:  { marginBottom: 14 },
  label:  { display: 'block', fontSize: 13, marginBottom: 4 },
  input:  { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  btn:    { width: '100%', padding: '10px', background: '#0073e6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', marginTop: 6 },
  error:  { color: '#e53e3e', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  toggle: { textAlign: 'center', fontSize: 13, marginTop: 16, color: '#555' },
  link:   { color: '#0073e6', cursor: 'pointer', fontWeight: 'bold' },
};
