import React, { useState } from 'react';
import { authRequest, goToRolePage, saveSession } from '../auth.js';
import { accountText, LanguagePicker, useLanguage } from '../language.js';

export default function Login() {
  const [language, setLanguage] = useLanguage();
  const t = accountText[language];
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await authRequest('login', {
        email: form.get('email'),
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
      <form className="account-card" onSubmit={handleSubmit}>
        <a className="account-back" href="/" data-route>? BTR Rwamiko TSS</a>
        <LanguagePicker language={language} onChange={setLanguage} />
        <div className="eyebrow"><span className="eyebrow-dot" /> {t.welcome}</div>
        <h1>{t.login}</h1>
        <p>{t.loginDescription}</p>
        <section className="account-section">
          <h2>{t.accountDetails}</h2>
          <div className="account-fields">
            <label>{t.email}<input name="email" type="email" autoComplete="email" required /></label>
            <label>{t.password}<input name="password" type="password" autoComplete="current-password" required /></label>
          </div>
        </section>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? t.signingIn : t.login}</button>
        <div className="account-switch">{t.newToBtr} <a href="/register" data-route>{t.createAccount}</a></div>
      </form>
    </main>
  );
}
