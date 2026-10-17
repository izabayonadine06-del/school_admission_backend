import React, { useState } from 'react';
import { API_BASE_URL } from '../auth.js';

export default function InitialPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('password') !== data.get('confirmPassword')) { setMessage('Passwords do not match.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/initial-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: data.get('password') }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not set your password.');
      form.reset(); setMessage(`${result.message} You can sign in from the login page.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <main className="account-page"><section className="account-card">
    <a href="/" data-route>← School home</a><p className="eyebrow">PARENT ACCOUNT SETUP</p><h1>Create your password</h1>
    <p>Choose a password to access your parent account. Use at least 12 characters.</p>
    {!token && <p role="alert">This setup link is missing its security token. Please contact the school.</p>}
    {message && <p role="status">{message}</p>}
    <form onSubmit={submit} className="account-form">
      <label>Password<input name="password" type="password" minLength="12" maxLength="128" required autoComplete="new-password"/></label>
      <label>Confirm password<input name="confirmPassword" type="password" minLength="12" maxLength="128" required autoComplete="new-password"/></label>
      <button disabled={busy || !token}>{busy ? 'Saving…' : 'Set password'}</button>
    </form>
  </section></main>;
}
