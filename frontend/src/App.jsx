import React, { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ParentHome from './pages/parents/ParentHome.jsx';
import HeadteacherHome from './pages/headteacher/HeadteacherHome.jsx';
import PublicApply from './pages/parents/PublicApply.jsx';
import InitialPassword from './pages/InitialPassword.jsx';
import { API_BASE_URL, clearSession, readSession } from './auth.js';

const routes = {
  '/': Home,
  '/home': Home,
  '/register': Register,
  '/login': Login,
  '/apply': PublicApply,
  '/setup-password': InitialPassword,
};

function AuthGate({ Page, requiredRole }) {
  const [state, setState] = useState('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const session = readSession();
    if (!session?.token) {
      setState('signed-out');
      return () => { active = false; };
    }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Session expired');
        return result.user;
      })
      .then((currentUser) => {
        if (!active) return;
        if (currentUser.role !== requiredRole) {
          setState('wrong-role');
          return;
        }
        setUser(currentUser);
        setState('authenticated');
      })
      .catch(() => {
        clearSession();
        if (active) setState('signed-out');
      });

    return () => { active = false; };
  }, [requiredRole]);

  useEffect(() => {
    if (state === 'signed-out' || state === 'wrong-role') {
      window.history.replaceState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [state]);

  if (state !== 'authenticated') return <main className="account-page"><p className="role-loading">{state === 'checking' ? 'Checking your session…' : 'Opening sign in…'}</p></main>;
  return <Page user={user} />;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      const link = event.target.closest('a[data-route]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.history.pushState({}, '', link.getAttribute('href'));
      setPath(window.location.pathname);
      window.scrollTo(0, 0);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (path === '/parents') return <AuthGate Page={ParentHome} requiredRole="PARENT" />;
  if (path === '/headteacher') return <AuthGate Page={HeadteacherHome} requiredRole="HEADTEACHER" />;
  const Page = routes[path] || Home;
  return <Page />;
}


