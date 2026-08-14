import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';

const API = 'http://localhost:5000/api/applications';

const STATUS_STYLES = {
  applied:   { background: '#dbeafe', color: '#1d4ed8' },
  interview: { background: '#fef9c3', color: '#92400e' },
  approved:  { background: '#dcfce7', color: '#166534' },
  rejected:  { background: '#fee2e2', color: '#991b1b' },
};

const defaultForm = {
  company: '', jobTitle: '', location: '', applicationLink: '',
  date: '', status: 'applied', offerLetterReceived: false, resume: null,
};

export default function App() {
  const [token, setToken]           = useState(localStorage.getItem('token'));
  const [userName, setUserName]     = useState(localStorage.getItem('name'));
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(defaultForm);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');

  const today = new Date().toISOString().split('T')[0];
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) fetchApplications(); }, [token]);

  async function fetchApplications() {
    const res = await fetch(API, { headers });
    if (res.status === 401) return logout();
    setApplications(await res.json());
  }

  function onAuth(t, name) { setToken(t); setUserName(name); }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setToken(null); setUserName(null); setApplications([]);
  }

  function openModal() {
    setForm({ ...defaultForm, date: today });
    setError('');
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave() {
    if (!form.company.trim() || !form.jobTitle.trim()) {
      setError('Company and Job Title are required.');
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'resume') { if (val) formData.append('resume', val); }
      else formData.append(key, val);
    });
    await fetch(API, { method: 'POST', headers, body: formData });
    fetchApplications();
    setShowModal(false);
  }

  async function handleDelete(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers });
    fetchApplications();
  }

  async function toggleOfferLetter(app) {
    await fetch(`${API}/${app._id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerLetterReceived: !app.offerLetterReceived }),
    });
    fetchApplications();
  }

  if (!token) return <AuthPage onAuth={onAuth} />;

  const counts = ['applied', 'interview', 'approved', 'rejected'].reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>🗂 Job Tracker</h2>
        <div style={styles.userInfo}>
          <span style={{ fontSize: 14 }}>👤 {userName}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total',     value: applications.length, bg: '#f0f4ff', color: '#333' },
          { label: 'Applied',   value: counts.applied,      bg: '#dbeafe', color: '#1d4ed8' },
          { label: 'Interview', value: counts.interview,    bg: '#fef9c3', color: '#92400e' },
          { label: 'Approved',  value: counts.approved,     bg: '#dcfce7', color: '#166534' },
          { label: 'Rejected',  value: counts.rejected,     bg: '#fee2e2', color: '#991b1b' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg, color: s.color }}>
            <div style={styles.statNum}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <button style={styles.addBtn} onClick={openModal}>+ Add Application</button>
        <div style={styles.filters}>
          {['all', 'applied', 'interview', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            {['#', 'Company', 'Job Title', 'Location', 'App Link', 'Date Applied', 'Status', 'Offer Letter', 'Resume', 'Action'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={10} style={styles.emptyMsg}>No applications found.</td></tr>
          ) : (
            filtered.map((app, i) => (
              <tr key={app._id}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{app.company}</td>
                <td style={styles.td}>{app.jobTitle}</td>
                <td style={styles.td}>{app.location || '—'}</td>
                <td style={styles.td}>
                  {app.applicationLink
                    ? <a href={app.applicationLink} target="_blank" rel="noreferrer" style={styles.link}>View</a>
                    : '—'}
                </td>
                <td style={styles.td}>{app.date || '—'}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...STATUS_STYLES[app.status] }}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
                <td style={styles.td}>
                  {app.status === 'approved'
                    ? <input type="checkbox" checked={app.offerLetterReceived} onChange={() => toggleOfferLetter(app)} />
                    : '—'}
                </td>
                <td style={styles.td}>
                  {app.resume?.filename
                    ? <a href={`http://localhost:5000/api/applications/${app._id}/resume`}
                        style={styles.link}
                        onClick={e => { e.preventDefault(); downloadResume(app._id, app.resume.filename); }}>
                        ⬇ {app.resume.filename}
                      </a>
                    : '—'}
                </td>
                <td style={styles.td}>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(app._id)}>🗑</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: 16 }}>Add Job Application</h3>
            {error && <p style={styles.error}>{error}</p>}

            {[
              { label: 'Company Name *',   name: 'company',         placeholder: 'e.g. Amazon' },
              { label: 'Job Title *',      name: 'jobTitle',        placeholder: 'e.g. Software Engineer' },
              { label: 'Location',         name: 'location',        placeholder: 'e.g. Seattle, WA' },
              { label: 'Application Link', name: 'applicationLink', placeholder: 'https://...' },
            ].map(({ label, name, placeholder }) => (
              <div key={name} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input style={styles.input} name={name} value={form[name]} placeholder={placeholder} onChange={handleChange} />
              </div>
            ))}

            <div style={styles.formGroup}>
              <label style={styles.label}>Date Applied</label>
              <input style={styles.input} type="date" name="date" value={form.date} onChange={handleChange} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select style={styles.input} name="status" value={form.status} onChange={handleChange}>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {form.status === 'approved' && (
              <div style={{ ...styles.formGroup, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="offerLetterReceived" checked={form.offerLetterReceived} onChange={handleChange} />
                <label style={styles.label}>Offer Letter Received?</label>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Resume (PDF/DOC)</label>
              <input style={styles.input} type="file" accept=".pdf,.doc,.docx"
                onChange={e => setForm(prev => ({ ...prev, resume: e.target.files[0] || null }))} />
              {form.resume && <p style={styles.fileName}>📎 {form.resume.name}</p>}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function downloadResume(id, filename) {
    const res = await fetch(`${API}/${id}/resume`, { headers });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}

const styles = {
  page:         { fontFamily: 'Arial, sans-serif', padding: 24, background: '#f4f6f9', minHeight: '100vh', color: '#333' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo:     { display: 'flex', alignItems: 'center', gap: 12 },
  logoutBtn:    { padding: '6px 14px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  statsRow:     { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard:     { flex: 1, minWidth: 100, padding: '14px 16px', borderRadius: 10, textAlign: 'center' },
  statNum:      { fontSize: 26, fontWeight: 'bold' },
  statLabel:    { fontSize: 12, marginTop: 2 },
  toolbar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 },
  addBtn:       { padding: '10px 20px', background: '#0073e6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  filters:      { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:    { padding: '6px 14px', border: '1px solid #ccc', background: '#fff', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  filterActive: { background: '#0073e6', color: '#fff', border: '1px solid #0073e6' },
  table:        { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden' },
  th:           { background: '#0073e6', color: '#fff', padding: '12px 14px', textAlign: 'left', fontSize: 13 },
  td:           { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #eee' },
  emptyMsg:     { textAlign: 'center', padding: 30, color: '#888', fontSize: 14 },
  badge:        { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  deleteBtn:    { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 16 },
  link:         { color: '#0073e6', textDecoration: 'none', fontWeight: 'bold' },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal:        { background: '#fff', padding: 28, borderRadius: 10, width: 440, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' },
  formGroup:    { marginBottom: 14 },
  label:        { display: 'block', fontSize: 13, marginBottom: 4 },
  input:        { width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelBtn:    { padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: 6, cursor: 'pointer' },
  saveBtn:      { padding: '8px 16px', background: '#0073e6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  error:        { color: '#e53e3e', fontSize: 13, marginBottom: 10 },
  fileName:     { fontSize: 12, color: '#555', marginTop: 4 },
};
