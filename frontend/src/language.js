import React, { useState } from 'react';

export const getLanguage = () => localStorage.getItem('btr.parent.language') === 'rw' ? 'rw' : 'en';

export function useLanguage() {
  const [language, setLanguage] = useState(getLanguage);
  function changeLanguage(value) {
    localStorage.setItem('btr.parent.language', value);
    setLanguage(value);
  }
  return [language, changeLanguage];
}

export function LanguagePicker({ language, onChange }) {
  const rw = language === 'rw';
  return <label className="account-language-picker">{rw ? 'Ururimi' : 'Language'}<select aria-label={rw ? 'Ururimi' : 'Language'} value={language} onChange={(event) => onChange(event.target.value)}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label>;
}

export const accountText = {
  en: {
    welcome: 'WELCOME BACK', login: 'Log in', loginDescription: 'Sign in to continue to your school account.', accountDetails: 'Account details', email: 'Email address', password: 'Password', signingIn: 'Signing in…', newToBtr: 'New to BTR?', createAccount: 'Create an account',
    join: 'JOIN OUR COMMUNITY', createTitle: 'Create your account', registerDescription: 'Register as a parent to connect with BTR Rwamiko TSS.', yourDetails: 'Your details', fullName: 'Full name', phone: 'Phone number', optional: 'Optional', address: 'Address', secure: 'Secure your account', passwordHelp: 'Use at least 12 characters.', creating: 'Creating account…', createParent: 'Create parent account', already: 'Already registered?', logIn: 'Log in',
  },
  rw: {
    welcome: 'MURAKAZE NEZA', login: 'Injira', loginDescription: 'Injira kugira ngo ukomeze kuri konti yawe y’ishuri.', accountDetails: 'Amakuru ya konti', email: 'Imeyili', password: 'Ijambo ry’ibanga', signingIn: 'Turimo kwinjira…', newToBtr: 'Ni ubwa mbere kuri BTR?', createAccount: 'Fungura konti',
    join: 'TWIGANE', createTitle: 'Fungura konti yawe', registerDescription: 'Iyandikishe nk’umubyeyi kugira ngo uhuze na BTR Rwamiko TSS.', yourDetails: 'Amakuru yawe', fullName: 'Amazina yose', phone: 'Nimero ya telefoni', optional: 'Si ngombwa', address: 'Aderesi', secure: 'Rinda konti yawe', passwordHelp: 'Koresha inyuguti nibura 12.', creating: 'Turimo gufungura konti…', createParent: 'Fungura konti y’umubyeyi', already: 'Usanzwe ufite konti?', logIn: 'Injira',
  },
};
