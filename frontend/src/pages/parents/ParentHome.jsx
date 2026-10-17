import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, logout } from '../../auth.js';
import AIAssistant from './AIAssistant.jsx';

const tabs = ['Overview', 'My children', 'Applications', 'Announcements', 'Notifications', 'Messages', 'AI Assistant', 'Help'];
const translations = {
  en: { language:'Language', overview:'Overview', children:'My children', applications:'Applications', announcements:'Announcements', notifications:'Notifications', messages:'Messages', assistant:'AI Assistant', help:'Help', yourSpace:'YOUR SPACE', parentPortal:'PARENT PORTAL', parentAccount:'Parent account', logout:'Log out', parentSpace:'PARENT SPACE', heroKicker:'YOUR FAMILY, CONNECTED', greeting:'Good to see you,', heroText:'Keep up with your children\u2019s learning and school admissions in one place.', myChildren:'MY CHILDREN', viewChildren:'View children', trackApplications:'Track applications', unreadUpdates:'UNREAD UPDATES', seeNotifications:'See notifications', admissions:'ADMISSIONS', progress:'Application progress', viewAll:'View all', schoolNews:'FROM YOUR SCHOOL', latestUpdates:'Latest updates', allUpdates:'All updates', noApplications:'No applications yet', startApplication:'Start an application', addChild:'Add a child', noAnnouncements:'There are no school announcements yet.', loading:'Loading your school information\u2026', refresh:'Refresh', tagline:'Practical learning. Lasting skills.' },
  rw: { language:'Ururimi', overview:'Incamake', children:'Abana banjye', applications:'Ubusabe', announcements:'Amatangazo', notifications:'Ubutumwa', messages:'Ibiganiro', assistant:'Umufasha wa AI', help:'Ubufasha', yourSpace:'AHO URI', parentPortal:'URUBUGA RW\u2019UMUBYEYI', parentAccount:'Konti y\u2019umubyeyi', logout:'Sohoka', parentSpace:'URUBUGA RW\u2019UMUBYEYI', heroKicker:'UMURYANGO WAWE, URI HAMWE', greeting:'Tunejejwe no kongera kukubona,', heroText:'Kurikirana imyigire y\u2019abana bawe n\u2019ubusabe bwo kwiga ahantu hamwe.', myChildren:'ABANA BANJYE', viewChildren:'Reba abana', trackApplications:'Kurikirana ubusabe', unreadUpdates:'UBUTUMWA BUTASOMWE', seeNotifications:'Reba ubutumwa', admissions:'KWINJIZA ABANYESHURI', progress:'Aho ubusabe bugeze', viewAll:'Reba byose', schoolNews:'AMAKURU AVA KU ISHURI', latestUpdates:'Amakuru mashya', allUpdates:'Amakuru yose', noApplications:'Nta busabe burahari', startApplication:'Tangira ubusabe', addChild:'Ongeramo umwana', noAnnouncements:'Nta matangazo y\u2019ishuri arahari.', loading:'Turimo gufungura amakuru y\u2019ishuri\u2026', refresh:'Kongera gufungura', tagline:'Kwiga ngiro. Ubumenyi burambye.' },
};
const trades = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];
const levels = ['L3', 'L4', 'L5'];
const tabIcons = { Overview: 'home', 'My children': 'students', Applications: 'applications', Announcements: 'announcements', Notifications: 'notifications', Messages: 'messages', 'AI Assistant': 'assistant', Help: 'help' };

function SidebarIcon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></>,
    students: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20"/></>,
    applications: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3"/></>,
    announcements: <><path d="M3 11v2a2 2 0 0 0 2 2h2l9 5V4l-9 5H5a2 2 0 0 0-2 2Z"/><path d="m8 15 2 6M19 9l2-2M19 15l2 2"/></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    messages: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8M8 15h5"/></>,
    assistant: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15ZM5 3l.7 1.3L7 5l-1.3.7L5 7l-.7-1.3L3 5l1.3-.7L5 3Z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.2 1-1.8 1.4-1.8 3M12 17.5h.01"/></>,
  };
  return <svg {...common}>{paths[name] || paths.help}</svg>;
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

async function uploadApplicationDocument(applicationId, documentType, file, token) {
  const form = new FormData();
  form.append('documentType', documentType);
  form.append('file', file);
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}.`);
}
async function replaceApplicationDocument(applicationId, documentId, file, token) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents/${documentId}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Could not replace ${file.name}.`);
}
const dateLabel = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—';
const prettyStatus = (value) => (value || 'PENDING').replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());

export default function ParentHome({ user }) {
  const session = (() => { try { return JSON.parse(localStorage.getItem('btr.session') || 'null'); } catch { return null; } })();
  const token = session?.token;
  const [tab, setTab] = useState('Overview');
  const [language, setLanguage] = useState(() => localStorage.getItem('btr.parent.language') === 'rw' ? 'rw' : 'en');
  const t = translations[language];
  const [data, setData] = useState({ students: [], applications: [], announcements: [], notifications: [], conversations: [], capacities: [] });
  const [capacityYear, setCapacityYear] = useState(new Date().getFullYear());
  const [showCapacity, setShowCapacity] = useState(false);
  const [applicationTrade, setApplicationTrade] = useState('');
  const [applicationLevel, setApplicationLevel] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState('');
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [applicationDocuments, setApplicationDocuments] = useState([]);
  const [documentPreview, setDocumentPreview] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      request('/students', token), request('/applications', token), request('/announcements', token),
      request('/notifications?limit=20', token), request('/messages', token), request(`/capacities?year=${capacityYear}`, token),
    ]);
    const fields = ['students', 'applications', 'announcements', 'notifications', 'conversations', 'capacities'];
    const errors = results.flatMap((result, index) => result.status === 'rejected' ? [`${fields[index]}: ${result.reason?.message || result.reason}`] : []);
    setData((current) => {
      const updated = { ...current };
      results.forEach((result, index) => {
        if (result.status === 'rejected') return;
        const key = fields[index];
        updated[key] = result.value[key] || [];
      });
      return updated;
    });
    if (errors.length) setError(`Some dashboard information could not be refreshed (${errors.join('; ')}).`);
    setLoading(false);
  }, [token, capacityYear]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    const refreshPlaces = async () => {
      try {
        const result = await request(`/capacities?year=${capacityYear}`, token);
        if (active) setData((current) => ({ ...current, capacities: result.capacities || [] }));
      } catch { /* Keep showing the last successfully loaded availability. */ }
    };
    const timer = window.setInterval(refreshPlaces, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [token, capacityYear]);

  async function perform(task, success) {
    setBusy(true); setError(''); setNotice('');
    try { await task(); setNotice(success); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function payload(event) { return Object.fromEntries(new FormData(event.currentTarget).entries()); }
  async function addStudent(event) {
    event.preventDefault(); const values = payload(event);
    await perform(async () => { await request('/students', token, { method: 'POST', body: JSON.stringify(values) }); setForm(''); }, 'Child profile saved.');
  }
  async function submitApplication(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const documents = [
      { field: 'previousResult', type: 'PREVIOUS_SCHOOL_REPORT', label: 'Previous school result' },
      { field: 'previousHeadteacherLetter', type: 'TRANSFER_DOCUMENT', label: 'Previous school headteacher document' },
      { field: 'studentPicture', type: 'STUDENT_PHOTO', label: 'Student photo' },
      { field: 'nationalExamResult', type: 'NATIONAL_EXAM_RESULT', label: 'National examination result' },
    ].map((document) => ({ ...document, file: values.get(document.field) })).filter((document) => document.file instanceof File && document.file.size > 0);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const invalid = documents.find((document) => document.file.size > 10 * 1024 * 1024 || !allowedTypes.includes(document.file.type) || (document.type === 'STUDENT_PHOTO' && document.file.type === 'application/pdf'));
    if (invalid) {
      setError(`${invalid.label}: choose a PDF, JPG, or PNG file under 10 MB. Student photos must be JPG or PNG.`);
      return;
    }

    setBusy(true); setError(''); setNotice('');
    try {
      const result = await request('/applications', token, { method: 'POST', body: JSON.stringify({ studentId: values.get('studentId'), requestedClass: values.get('requestedClass'), level: values.get('level'), admissionYear: Number(values.get('admissionYear')) }) });
      const student = data.students.find((item) => String(item.id) === String(values.get('studentId')));
      setData((current) => ({ ...current, applications: [{ ...result.application, studentName: student?.fullName || 'Student' }, ...current.applications] }));
      const failures = [];
      for (const document of documents) {
        try { await uploadApplicationDocument(result.application.id, document.type, document.file, token); }
        catch (uploadError) { failures.push(`${document.label} (${uploadError.message})`); }
      }
      setForm('');
      setNotice(failures.length ? `Application submitted, but these files need attention: ${failures.join('; ')}` : 'Application and selected documents submitted.');
      await refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }
  async function sendMessage(event) {
    event.preventDefault(); const values = payload(event);
    await perform(async () => { await request('/messages', token, { method: 'POST', body: JSON.stringify(values) }); setForm(''); }, 'Message sent to the school.');
  }
  async function openConversation(id) {
    setConversationId(id); setError('');
    try { const result = await request(`/messages/${id}`, token); setMessages(result.messages || []); }
    catch (e) { setError(e.message); }
  }
  async function reply(event) {
    event.preventDefault(); const formElement = event.currentTarget; const values = payload(event);
    await perform(async () => {
      await request(`/messages/${conversationId}`, token, { method: 'POST', body: JSON.stringify(values) });
      const result = await request(`/messages/${conversationId}`, token); setMessages(result.messages || []); formElement.reset();
    }, 'Reply sent.');
  }
  async function readNotification(item) {
    if (!item.readAt) await perform(() => request(`/notifications/${item.id}/read`, token, { method: 'PATCH' }), 'Notification marked as read.');
    if (item.relatedRecordType === 'APPLICATION' && item.relatedRecordId) {
      setTab('Applications');
      await viewApplication(item.relatedRecordId);
    }
  }
  async function viewApplication(id) {
    setError('');
    try {
      const [result, docs] = await Promise.all([
        request(`/applications/${id}`, token),
        request(`/applications/${id}/documents`, token),
      ]);
      setApplicationDetails(result.application);
      setApplicationDocuments(docs.documents || []);
    } catch (e) { setError(e.message); }
  }
  async function openApplicationDocument(document) {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${document.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not open this document.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDocumentPreview((current) => { if (current?.url) URL.revokeObjectURL(current.url); return { url, name: document.originalFilename, mimeType: document.mimeType || blob.type }; });
    } catch (e) { setError(e.message); }
  }
  function closeDocumentPreview() {
    setDocumentPreview((current) => { if (current?.url) URL.revokeObjectURL(current.url); return null; });
  }
  async function updateApplication(event, id) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries([...formData.entries()].filter(([key, value]) => !key.startsWith('document:') && !(value instanceof File)));
    await perform(async () => {
      await request(`/applications/${id}`, token, { method: 'PATCH', body: JSON.stringify(values) });
      const replacements = [...formData.entries()].filter(([key, value]) => key.startsWith('document:') && value instanceof File && value.size > 0);
      for (const [key, file] of replacements) await replaceApplicationDocument(id, key.slice('document:'.length), file, token);
      const additions = [...formData.entries()].filter(([key, value]) => key.startsWith('newDoc:') && value instanceof File && value.size > 0);
      for (const [key, file] of additions) await uploadApplicationDocument(id, key.slice('newDoc:'.length), file, token);
      setForm('');
    }, 'Application and selected documents updated.');
  }
  async function startApplicationEdit(item) {
    setError(''); setApplicationDetails(null); setApplicationDocuments([]); setForm(`edit:${item.id}`);
    try {
      const result = await request(`/applications/${item.id}/documents`, token);
      setApplicationDocuments(result.documents || []);
    } catch (e) { setError(`Could not load documents for editing: ${e.message}`); }
  }
  async function cancelApplication(id) {
    if (!window.confirm('Cancel this pending application?')) return;
    await perform(() => request(`/applications/${id}/cancel`, token, { method: 'POST' }), 'Application cancelled.');
    if (String(applicationDetails?.id) === String(id)) setApplicationDetails(null);
  }
  async function signOut() {
    await logout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'));
  }
  const unread = data.notifications.filter((item) => !item.readAt).length;
  const eligibleStudents = data.students.filter((student) => !data.applications.some((application) => String(application.studentId) === String(student.id) && !['REJECTED', 'CANCELLED'].includes(application.status)));
  const availableTrades = trades.filter((trade) => data.capacities.some((item) => item.requestedClass === trade && Number(item.remaining) > 0));
  const availableLevels = data.capacities.filter((item) => item.requestedClass === applicationTrade && Number(item.remaining) > 0);
  const go = (name) => { setTab(name); setError(''); setNotice(''); setForm(''); };

  return <div className="parent-dashboard">
    <aside className="parent-sidebar">
      <a className="parent-brand" href="/" data-route><b>BTR</b><span>RWAMIKO<small>{t.parentPortal}</small></span></a>
      <div className="sidebar-label">{t.yourSpace}</div>
      <nav className="parent-nav">{tabs.map((name) => <button key={name} className={`${tab === name ? 'active' : ''}${name === 'AI Assistant' ? ' ai-nav-item' : ''}`} onClick={() => go(name)}><span className="side-icon"><SidebarIcon name={tabIcons[name]} /></span>{tabLabel(name, t)}{name === 'Messages' && <i>{data.conversations.reduce((n, c) => n + Number(c.unreadCount || 0), 0) || ''}</i>}{name === 'Notifications' && unread > 0 && <i>{unread}</i>}</button>)}</nav>
      <div className="sidebar-profile"><span>{user.fullName?.[0]?.toUpperCase()}</span><div><b>{user.fullName}</b><small>{t.parentAccount}</small></div><button onClick={signOut} title={t.logout}>?</button></div>
    </aside>
    <main className="parent-content">
      <header className="parent-header"><div><small>BTR RWAMIKO TSS · PARENT SPACE</small><h1>{tabLabel(tab, t)}</h1></div><label className="parent-language-picker">{t.language}<select aria-label={t.language} value={language} onChange={(event) => { const value = event.target.value; setLanguage(value); localStorage.setItem('btr.parent.language', value); }}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label><button className="header-bell" onClick={() => go('Overview')}>? <b>{unread || ''}</b></button></header>
      {error && <div className="parent-flash error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
      {notice && <div className="parent-flash success" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      {loading ? <div className="parent-loading">{t.loading}</div> : <>
        {tab === 'Overview' && <>
          <section className="parent-hero"><small>{t.heroKicker}</small><h2>{t.greeting}<br /><em>{user.fullName?.split(' ')[0]}.</em></h2><p>{t.heroText}</p><span className="hero-orbit">01</span></section>
          <section className="parent-metrics"><Metric title={t.myChildren} count={data.students.length} action={t.viewChildren} icon="students" onClick={() => go('My children')} /><Metric title={t.applications.toUpperCase()} count={data.applications.length} action={t.trackApplications} icon="applications" onClick={() => go('Applications')} /><Metric title={t.unreadUpdates} count={unread} action={t.seeNotifications} icon="notifications" onClick={() => go('Notifications')} /></section>
          <div className="parent-columns"><section className="parent-panel"><PanelHeading kicker={t.admissions} title={t.progress} action={t.viewAll} onClick={() => go('Applications')} />{data.applications.length ? data.applications.slice(0, 4).map((item) => <Application key={item.id} item={item} />) : <Empty title={t.noApplications} text={data.students.length ? t.startApplication : t.addChild} action={data.students.length ? t.startApplication : t.addChild} onClick={() => { if (data.students.length) { go("Applications"); setForm("application"); } else { go("My children"); setForm("student"); } }} />}</section>
          <section className="parent-panel"><PanelHeading kicker={t.schoolNews} title={t.latestUpdates} action={t.allUpdates} onClick={() => go('Announcements')} />{data.announcements.length ? data.announcements.slice(0, 3).map((item) => <Announcement key={item.id} item={item} />) : <p className="parent-muted">{t.noAnnouncements}</p>}</section></div>
          <NotificationList items={data.notifications.slice(0, 5)} onRead={readNotification} />
        </>}

        {tab === 'My children' && <section className="parent-panel"><PanelHeading kicker="FAMILY RECORDS" title="My children" description="Manage student profiles connected to your account." action={form === 'student' ? 'Close' : '+ Add a child'} onClick={() => setForm(form === 'student' ? '' : 'student')} />
          {form === 'student' && <form className="parent-form" onSubmit={addStudent}><h3>Child details</h3><div className="parent-form-grid"><label>Full name<input name="fullName" required minLength="2" maxLength="160" /></label><label>Date of birth<input name="dateOfBirth" type="date" required max={new Date().toISOString().slice(0, 10)} /></label><label>Gender <small>Optional</small><input name="gender" maxLength="30" /></label><label>Previous school <small>Optional</small><input name="previousSchool" maxLength="200" /></label><label className="field-wide">Home address <small>Optional</small><textarea name="address" rows="2" maxLength="2000" /></label></div><FormActions busy={busy} label="Save child profile" onCancel={() => setForm('')} /></form>}
          {data.students.length ? <div className="parent-students">{data.students.map((student, i) => <article key={student.id} className="parent-student"><span className={`student-monogram monogram-${i % 3}`}>{student.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span><div><small>STUDENT PROFILE</small><h3>{student.fullName}</h3><p>Born {dateLabel(student.dateOfBirth)}{student.previousSchool ? ` · ${student.previousSchool}` : ''}</p></div><button onClick={() => { go('Applications'); setForm('application'); }}>+ Apply</button></article>)}</div> : <Empty title="Add your first child" text="Create a student profile before starting an application." action="Add a child" onClick={() => setForm('student')} />}
        </section>}

        {tab === 'Applications' && <section className="parent-panel"><PanelHeading kicker="ADMISSIONS" title="Applications" description="Follow each application as the school reviews it." action={form === 'application' ? 'Close' : eligibleStudents.length ? '+ New application' : ''} onClick={() => { setApplicationTrade(''); setApplicationLevel(''); setForm(form === 'application' ? '' : 'application'); }} />
          <button type="button" className="parent-capacity-toggle" onClick={() => setShowCapacity((visible) => !visible)}>{showCapacity ? 'Close available places' : 'View available places'}</button>{showCapacity && <section className="parent-capacity-board"><header><div><small>LIVE ADMISSION PLACES</small><h3>Places available for {capacityYear}</h3></div><label>Admission year<select value={capacityYear} onChange={(event) => { setCapacityYear(Number(event.target.value)); setApplicationTrade(''); setApplicationLevel(''); }}><option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>{[1,2,3,4,5,6].map((offset) => <option key={offset} value={new Date().getFullYear() + offset}>{new Date().getFullYear() + offset}</option>)}</select></label></header>{data.capacities.length ? <div className="parent-capacity-table-wrap"><table className="parent-capacity-table"><thead><tr><th>Trade</th><th>Level</th><th>Total places</th><th>Enrolled</th><th>Remaining</th></tr></thead><tbody>{data.capacities.map((item) => <tr key={item.id}><td>{item.requestedClass}</td><td>{item.level}</td><td>{item.capacity}</td><td>{item.enrolled}</td><td><strong className={Number(item.remaining) > 0 ? 'places-open' : 'places-full'}>{Number(item.remaining) > 0 ? item.remaining : 'Full'}</strong></td></tr>)}</tbody></table></div> : <p className="parent-capacity-empty">The school has not set available places for {capacityYear} yet.</p>}</section>}
          {form === 'application' && eligibleStudents.length > 0 && <form className="parent-form" onSubmit={submitApplication}><h3>Start an application</h3><input type="hidden" name="admissionYear" value={capacityYear} /><div className="parent-form-grid"><label>Child<select name="studentId" defaultValue="" required><option value="" disabled>Select a child</option>{eligibleStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label><label>Trade / program<select name="requestedClass" value={applicationTrade} onChange={(event) => { setApplicationTrade(event.target.value); setApplicationLevel(''); }} required><option value="" disabled>Select a trade with places</option>{availableTrades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><label>Level<select name="level" value={applicationLevel} onChange={(event) => setApplicationLevel(event.target.value)} required><option value="" disabled>Select an available level</option>{availableLevels.map((item) => <option key={item.level} value={item.level}>{item.level} · {item.remaining} places remaining</option>)}</select></label></div>{(!availableTrades.length || (applicationTrade && !availableLevels.length)) && <p className="parent-capacity-empty">There are no places available for this selection. Check another year or contact the school.</p>}<h4 className="document-upload-title">Supporting documents <small>Optional · PDF, JPG, or PNG · Max 10 MB each</small></h4><div className="document-upload-grid"><label><span>Previous school result</span><small>Result or school report</small><input type="file" name="previousResult" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></label><label><span>Previous school headteacher document</span><small>Transfer or recommendation letter</small><input type="file" name="previousHeadteacherLetter" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></label><label><span>Student photo</span><small>JPG or PNG image</small><input type="file" name="studentPicture" accept=".jpg,.jpeg,.png,image/jpeg,image/png" /></label><label><span>National examination result</span><small>Certificate or results slip</small><input type="file" name="nationalExamResult" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></label></div><FormActions busy={busy || !availableLevels.some((item) => item.level === applicationLevel)} label="Submit application" onCancel={() => setForm('')} /></form>}
          {data.students.length > 0 && eligibleStudents.length === 0 && <p className="parent-muted">Each child already has an active application. Rejected or cancelled applications can be submitted again.</p>}
          {!data.students.length ? <Empty title="Add a child first" text="A student profile is needed before you can apply." action="Add a child" onClick={() => { go('My children'); setForm('student'); }} /> : data.applications.length ? <div className="parent-table-wrap"><table className="applications-table"><thead><tr><th>Student</th><th>Reference</th><th>Admission year</th><th>Trade</th><th>Level</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.applications.map((item) => <React.Fragment key={item.id}><tr><td className="application-student-cell">{item.studentName}</td><td>{item.referenceNumber}</td><td>{item.admissionYear}</td><td>{item.requestedClass}</td><td>{item.level || 'L3'}</td><td>{dateLabel(item.submittedAt)}</td><td><em className={`status-${(item.status || 'pending').toLowerCase()}`}>{prettyStatus(item.status)}</em></td><td><div className="application-action-buttons"><button onClick={() => viewApplication(item.id)}>View</button>{item.status === 'PENDING' && <><button onClick={() => startApplicationEdit(item)}>Update</button><button onClick={() => cancelApplication(item.id)}>Cancel</button></>}</div></td></tr>{item.decisionComment && <tr className="application-note-row"><td colSpan="8">School note: {item.decisionComment}</td></tr>}</React.Fragment>)}</tbody></table></div> : <Empty title="No applications to track" text="Start an application for one of your children." action="New application" onClick={() => setForm('application')} />}
          {form.startsWith('edit:') && (() => { const item = data.applications.find((application) => String(application.id) === form.slice(5)); const student = data.students.find((record) => String(record.id) === String(item?.studentId)); return item?.status === 'PENDING' ? <form className="parent-form" onSubmit={(event) => updateApplication(event, item.id)}><h3>Update application for {item.studentName}</h3><div className="parent-form-grid"><label>Trade / program<select name="requestedClass" defaultValue={item.requestedClass} required>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><label>Level<select name="level" defaultValue={item.level || 'L3'} required>{levels.map((level) => <option key={level}>{level}</option>)}</select></label><label>Student name<input name="fullName" defaultValue={student?.fullName || item.studentName} required minLength="2" maxLength="160" /></label><label>Date of birth<input type="date" name="dateOfBirth" defaultValue={student?.dateOfBirth?.slice(0, 10) || ''} required /></label><label>Gender<input name="gender" defaultValue={student?.gender || ''} maxLength="30" /></label><label>Previous school<input name="previousSchool" defaultValue={student?.previousSchool || ''} maxLength="200" /></label><label className="field-wide">Address<textarea name="address" defaultValue={student?.address || ''} rows="2" maxLength="2000" /></label></div><h4 className="document-upload-title">Update documents <small>Replace current files or add a missing document.</small></h4><div className="document-upload-grid">{applicationDocuments.map((document) => <label key={document.id}><span>{document.documentType.replaceAll('_', ' ')}</span><small>Current file: {document.originalFilename}</small><input type="file" name={`document:${document.id}`} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></label>)}{[['PREVIOUS_SCHOOL_REPORT','Previous school result'],['TRANSFER_DOCUMENT','Headteacher transfer document'],['STUDENT_PHOTO','Student photo'],['NATIONAL_EXAM_RESULT','National examination result']].map(([type,label]) => <label key={type}><span>Add {label}</span><small>Optional · PDF, JPG or PNG</small><input type="file" name={`newDoc:${type}`} accept={type === 'STUDENT_PHOTO' ? '.jpg,.jpeg,.png,image/jpeg,image/png' : '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'} /></label>)}</div><FormActions busy={busy} label="Save application and documents" onCancel={() => { setForm(''); setApplicationDocuments([]); }} /></form> : null; })()}
          {applicationDetails && <section className="application-detail-card"><header className="application-detail-header"><div><small>APPLICATION DETAILS</small><span>{applicationDetails.referenceNumber}</span></div><button className="application-detail-close" onClick={() => { setApplicationDetails(null); setApplicationDocuments([]); }}>Close <b>×</b></button></header><div className="application-detail-title"><div><h3>{applicationDetails.studentName}</h3><p>Student information and submitted documents</p></div><em className={`status-${(applicationDetails.status || 'pending').toLowerCase()}`}>{prettyStatus(applicationDetails.status)}</em></div><div className="application-detail-grid"><p><b>Admission year</b><span>{applicationDetails.admissionYear}</span></p><p><b>Trade</b><span>{applicationDetails.requestedClass}</span></p><p><b>Level</b><span>{applicationDetails.level || 'L3'}</span></p><p><b>Date of birth</b><span>{dateLabel(applicationDetails.dateOfBirth)}</span></p><p><b>Gender</b><span>{applicationDetails.gender || 'Not provided'}</span></p><p><b>Previous school</b><span>{applicationDetails.previousSchool || 'Not provided'}</span></p><p><b>Address</b><span>{applicationDetails.address || 'Not provided'}</span></p></div>{applicationDetails.decisionComment && <div className="application-school-update"><b>Latest school update</b><p>{applicationDetails.decisionComment}</p></div>}<div className="application-documents"><h4>Student documents</h4>{applicationDocuments.length ? <ul>{applicationDocuments.map((document) => <li key={document.id}><span><b>{document.documentType.replaceAll('_', ' ')}</b><small>{document.originalFilename} · {prettyStatus(document.verificationStatus)}</small></span><button onClick={() => openApplicationDocument(document)}>View document</button></li>)}</ul> : <p>No documents have been uploaded for this application.</p>}</div></section>}
        </section>}

        {tab === 'Announcements' && <section className="parent-panel"><PanelHeading kicker="SCHOOL NEWS" title="Announcements" description="News and updates shared by BTR Rwamiko TSS." />{data.announcements.length ? data.announcements.map((item) => <Announcement key={item.id} item={item} detailed />) : <p className="parent-muted">There are no announcements yet. Check back soon.</p>}</section>}

        {tab === 'Notifications' && <NotificationList items={data.notifications} onRead={readNotification} />}
        {tab === 'AI Assistant' && <AIAssistant />}
        {tab === 'Help' && <section className="parent-panel help-panel"><div className="help-mark"><SidebarIcon name="help" /></div><PanelHeading kicker="WE’RE HERE TO HELP" title="How can we help?" description="A few quick answers for using your parent portal." /><div className="help-grid"><article><b>How do I apply?</b><p>Add your child under My children, then open Applications and choose New application.</p></article><article><b>Where can I see progress?</b><p>Application status and any school notes appear in your Applications list.</p></article><article><b>How do I contact the school?</b><p>Open Messages and choose New message to reach the headteacher.</p></article><article><b>Where are school updates?</b><p>Open Announcements for school news, or Notifications for account updates.</p></article></div></section>}

        {tab === 'Messages' && <section className="parent-panel"><PanelHeading kicker="SCHOOL CONTACT" title="Messages" description="Contact the headteacher or continue a conversation." action={form === 'message' ? 'Close' : '+ New message'} onClick={() => { setConversationId(''); setForm(form === 'message' ? '' : 'message'); }} />
          {form === 'message' && <form className="parent-form" onSubmit={sendMessage}><h3>Message the school</h3><label>Your message<textarea name="content" required maxLength="5000" rows="4" placeholder="How can the school help?" /></label><FormActions busy={busy} label="Send message" onCancel={() => setForm('')} /></form>}
          <div className="parent-messages"><div className="conversation-list">{data.conversations.map((item) => <button key={item.conversationId} className={conversationId === item.conversationId ? 'selected' : ''} onClick={() => openConversation(item.conversationId)}><b>{item.otherParticipant}</b><small>{dateLabel(item.lastMessageAt)}</small>{Number(item.unreadCount) > 0 && <i>{item.unreadCount}</i>}</button>)}{!data.conversations.length && <p className="parent-muted">No conversations yet. Send a new message to contact the school.</p>}</div><div className="conversation-view">{conversationId ? <><div className="message-thread">{messages.map((item) => <article key={item.id} className={String(item.senderId) === String(user.id) ? 'mine' : ''}><small>{item.senderName} · {dateLabel(item.sentAt)}</small><p>{item.content}</p></article>)}</div><form className="reply-form" onSubmit={reply}><textarea name="content" required maxLength="5000" rows="2" placeholder="Write a reply…" /><button disabled={busy}>Send</button></form></> : <div className="conversation-empty">Select a conversation to view messages.</div>}</div></div>
        </section>}
      </>}
      <footer className="parent-footer"><span>© BTR Rwamiko TSS</span><span>{t.tagline}</span><button onClick={refresh}>{t.refresh}</button></footer>
    </main>
    {documentPreview && <div className="document-preview-backdrop" role="presentation" onClick={closeDocumentPreview}><section className="document-preview" role="dialog" aria-modal="true" aria-label={documentPreview.name} onClick={(event) => event.stopPropagation()}><header><b>{documentPreview.name}</b><button type="button" onClick={closeDocumentPreview} aria-label="Close document preview">×</button></header>{documentPreview.mimeType?.startsWith('image/') ? <img src={documentPreview.url} alt={documentPreview.name} /> : <iframe src={documentPreview.url} title={documentPreview.name} />}</section></div>}
  </div>;
}

function Metric({ title, count, action, icon, onClick }) { return <article className="parent-metric"><div className="metric-heading"><span className="metric-icon"><SidebarIcon name={icon} /></span><small>{title}</small></div><strong>{String(count).padStart(2, '0')}</strong><button onClick={onClick}><span>{action}</span><i className="metric-arrow" aria-hidden="true" /></button></article>; }
function PanelHeading({ kicker, title, description, action, onClick }) { return <header className="parent-panel-heading"><div><small>{kicker}</small><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button onClick={onClick}>{action}</button>}</header>; }
function Application({ item, detailed = false, onView, onEdit, onCancel }) { return <article className={`parent-application ${detailed ? 'detailed' : ''}`}><div><b>{item.studentName}</b>{!detailed && <small>{item.requestedClass} / {item.level || 'L3'} · {item.referenceNumber}</small>}</div>{detailed && <><span>{item.referenceNumber}</span><span>{item.requestedClass} / {item.level || 'L3'}</span><span>{dateLabel(item.submittedAt)}</span></>}<div className={detailed ? 'application-actions' : ''}><em className={`status-${(item.status || 'pending').toLowerCase()}`}>{prettyStatus(item.status)}</em>{detailed && <div className="application-action-buttons"><button onClick={() => onView(item.id)}>View</button>{item.status === 'PENDING' && <><button onClick={() => onEdit(item.id)}>Update</button><button onClick={() => onCancel(item.id)}>Cancel</button></>}</div>}</div>{item.decisionComment && <p className="application-comment">School note: {item.decisionComment}</p>}</article>; }
function Announcement({ item, detailed = false }) { return <article className={`parent-announcement ${detailed ? 'detailed' : ''}`}><small>{dateLabel(item.publishedAt || item.createdAt)}</small><h3>{item.title}</h3><p>{item.content}</p>{detailed && <span>Shared by {item.authorName || 'BTR Rwamiko TSS'}</span>}</article>; }
function NotificationList({ items, onRead }) { return <section className="parent-panel" id="parent-notifications"><PanelHeading kicker="ACCOUNT ACTIVITY" title="Notifications" />{items.length ? items.map((item) => <button key={item.id} className={`parent-notification ${item.readAt ? '' : 'unread'}`} onClick={() => onRead(item)}><span>?</span><b>{item.message}</b><small>{dateLabel(item.createdAt)}</small></button>) : <p className="parent-muted">You’re all caught up.</p>}</section>; }
function Empty({ title, text, action, onClick }) { return <div className="parent-empty"><span>+</span><h3>{title}</h3><p>{text}</p>{action && <button onClick={onClick}>{action} ?</button>}</div>; }
function FormActions({ busy, label, onCancel }) { return <div className="parent-form-actions"><button type="button" onClick={onCancel}>Cancel</button><button disabled={busy}>{busy ? 'Saving…' : label}</button></div>; }




function tabLabel(name, t) { return ({ Overview:t.overview, 'My children':t.children, Applications:t.applications, Announcements:t.announcements, Notifications:t.notifications, Messages:t.messages, 'AI Assistant':t.assistant, Help:t.help })[name] || name; }
