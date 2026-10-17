import React, { useState } from 'react';
import { authRequest, goToRolePage, saveSession } from '../auth.js';

export default function Register() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await authRequest('register', {
        fullName: form.get('fullName'),
        email: form.get('email'),
        phone: form.get('phone'),
        address: form.get('address'),
        password: form.get('password'),
      });
      saveSession(session);
      goToRolePage(session.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <form className="account-card register-card" onSubmit={handleSubmit}>
        <a className="account-back" href="/" data-route>? BTR Rwamiko TSS</a>
        <div className="eyebrow"><span className="eyebrow-dot" /> JOIN OUR COMMUNITY</div>
        <h1>Create your account</h1>
        <p>Register as a parent to connect with BTR Rwamiko TSS.</p>
        <section className="account-section">
          <h2>Your details</h2>
          <div className="account-fields">
            <label>Full name<input name="fullName" autoComplete="name" required minLength="2" maxLength="160" /></label>
            <label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
            <label>Phone number <span className="field-optional">Optional</span><input name="phone" type="tel" autoComplete="tel" maxLength="32" /></label>
            <label>Address <span className="field-optional">Optional</span><textarea name="address" autoComplete="street-address" rows="2" maxLength="2000" /></label>
          </div>
        </section>
        <section className="account-section">
          <h2>Secure your account</h2>
          <div className="account-fields">
            <label>Password<input name="password" type="password" autoComplete="new-password" required minLength="12" maxLength="128" /><small>Use at least 12 characters.</small></label>
          </div>
        </section>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create parent account'}</button>
        <div className="account-switch">Already registered? <a href="/login" data-route>Log in</a></div>
      </form>
    </main>
  );
}
