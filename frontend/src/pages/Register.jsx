import React, { useState } from 'react';
import { authRequest, goToRolePage, saveSession } from '../auth.js';
import { accountText, LanguagePicker, useLanguage } from '../language.js';

export default function Register() {
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
        <LanguagePicker language={language} onChange={setLanguage} />
        <div className="eyebrow"><span className="eyebrow-dot" /> {t.join}</div>
        <h1>{t.createTitle}</h1>
        <p>{t.registerDescription}</p>
        <section className="account-section">
          <h2>{t.yourDetails}</h2>
          <div className="account-fields">
            <label>{t.fullName}<input name="fullName" autoComplete="name" required minLength="2" maxLength="160" /></label>
            <label>{t.email}<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
            <label>{t.phone} <span className="field-optional">{t.optional}</span><input name="phone" type="tel" autoComplete="tel" maxLength="32" /></label>
            <label>{t.address} <span className="field-optional">{t.optional}</span><textarea name="address" autoComplete="street-address" rows="2" maxLength="2000" /></label>
          </div>
        </section>
        <section className="account-section">
          <h2>{t.secure}</h2>
          <div className="account-fields">
            <label>{t.password}<input name="password" type="password" autoComplete="new-password" required minLength="12" maxLength="128" /><small>{t.passwordHelp}</small></label>
          </div>
        </section>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? t.creating : t.createParent}</button>
        <div className="account-switch">{t.already} <a href="/login" data-route>{t.logIn}</a></div>
      </form>
    </main>
  );
}
