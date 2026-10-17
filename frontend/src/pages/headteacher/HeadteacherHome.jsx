import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, logout } from '../../auth.js';

const pages = ['Dashboard', 'Applications', 'Public Applications', 'Available Places', 'Students', 'Parents', 'Announcements', 'Messages', 'Notifications', 'Reports'];
const trades = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];
const studentLevels = ['L3', 'L4', 'L5'];
const icons = { Dashboard: 'home', Applications: 'file', 'Public Applications': 'file', 'Available Places': 'chart', Students: 'students', Parents: 'parents', Announcements: 'news', Messages: 'chat', Notifications: 'news', Reports: 'chart' };

async function api(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}
const dateText = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '-';
const labelStatus = (value) => (value || 'PENDING').replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());

function HeadIcon({ name }) {
  const attrs = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></>,
    file: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    students: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 6a3 3 0 0 1 0 5M18 15a5 5 0 0 1 3 4"/></>,
    parents: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 15a5 5 0 0 1 5 5"/></>,
    news: <><path d="M3 11v2a2 2 0 0 0 2 2h2l9 5V4l-9 5H5a2 2 0 0 0-2 2Z"/><path d="m8 15 2 6M19 9l2-2M19 15l2 2"/></>,
    chat: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8M8 15h5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  };
  return <svg {...attrs}>{shapes[name] || shapes.home}</svg>;
}

export default function HeadteacherHome({ user }) {
  const session = (() => { try { return JSON.parse(localStorage.getItem('btr.session') || 'null'); } catch { return null; } })();
  const token = session?.token;
  const [page, setPage] = useState('Dashboard');
  const [dashboard, setDashboard] = useState({ statistics: {}, applicationsByStatus: [], recentActivity: [] });
  const [applications, setApplications] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [capacityYear, setCapacityYear] = useState(new Date().getFullYear());
  const [capacityDraft, setCapacityDraft] = useState({ requestedClass: trades[0], level: 'L3', capacity: '' });
  const [publicAdmissions, setPublicAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [thread, setThread] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [report, setReport] = useState({ applicationsByStatus: [], applicationsByClass: [] });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewId, setReviewId] = useState('');
  const [reviewDocuments, setReviewDocuments] = useState({});
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [disciplineStudentId, setDisciplineStudentId] = useState('');
  const [studentTrade, setStudentTrade] = useState('');
  const [studentLevel, setStudentLevel] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentNotice, setStudentNotice] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignParentId, setAssignParentId] = useState('');
  const [announcementForm, setAnnouncementForm] = useState(false);
  const loadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError('');
    if (!loadedOnce.current) setLoading(true);
    const results = await Promise.allSettled([
      api('/admin/dashboard', token), api('/applications?limit=100', token), api('/admin/students?limit=100', token),
      api('/admin/parents?limit=100', token), api('/announcements', token), api('/messages', token),
      api('/notifications?limit=50', token), api('/admin/reports/admissions', token), api('/admin/public-admissions', token), api('/admin/reports/activity', token),
      api(`/capacities?year=${capacityYear}`, token),
    ]);
    const setters = [
      (value) => setDashboard(value), (value) => setApplications(value.applications || []),
      (value) => setStudents(value.students || []), (value) => setParents(value.parents || []),
      (value) => setAnnouncements(value.announcements || []), (value) => setConversations(value.conversations || []),
      (value) => setNotifications(value.notifications || []), (value) => setReport(value),
      (value) => setPublicAdmissions(value.admissions || []), (value) => setCapacities(value.capacities || []), (value) => setActivityLogs(value.logs || []),
    ];
    const failed = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') setters[index](result.value);
      else failed.push(result.reason?.message || 'A dashboard section could not be refreshed');
    });
    if (failed.length && !loadedOnce.current) setError(`Some school data could not be loaded: ${failed.join('; ')}`);
    loadedOnce.current = true;
    setLoading(false);
  }, [token, capacityYear]);
  useEffect(() => { refresh(); }, [refresh]);

  async function action(task, success) {
    setBusy(true); setError(''); setNotice('');
    try { const result = await task(); setNotice(typeof success === 'function' ? success(result) : success); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const readForm = (event) => Object.fromEntries(new FormData(event.currentTarget).entries());
  async function reviewPublicAdmission(id, status) {
    await action(() => api('/admin/public-admissions/' + id, token, { method: 'PATCH', body: JSON.stringify({ status }) }), status === 'ACCEPTED' ? 'Request accepted. Create the parent account to add the student to school records.' : 'Public request rejected.');
  }
  async function saveTradeCapacity(event) {
    event.preventDefault();
    const form = readForm(event);
    await action(() => api('/capacities', token, {
      method: 'PUT', body: JSON.stringify({ ...form, admissionYear: capacityYear, capacity: Number(form.capacity) })
    }), 'Available places saved for this year, trade, and level.');
    setCapacityDraft((current) => ({ ...current, capacity: '' }));
  }
  async function createPublicParentAccount(id) {
    await action(() => api('/admin/public-admissions/' + id + '/create-account', token, { method: 'POST' }), (result) => result.emailSent ? 'Parent account and student record created. Password setup link emailed to ' + result.parentEmail + '.' : result.accountCreated ? 'Parent and student records created. Email setup link could not be sent; check Brevo settings.' : 'Student record linked to the existing parent account.');
  }  async function openPublicDocument(record) {
    try {
      const response = await fetch(API_BASE_URL + '/admin/public-admissions/' + record.requestId + '/documents/' + record.id, { headers: { Authorization: 'Bearer ' + token } });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'Could not open this file.'); }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      setDocumentPreview({ url, name: record.originalFilename, mimeType: record.mimeType || file.type });
    } catch (e) { setError(e.message); }
  }  async function openReview(id) {
    const nextId = String(id);
    if (reviewId === nextId) { setReviewId(''); return; }
    setReviewId(nextId);
    setDocumentsLoading(true);
    try {
      const result = await api(`/applications/${nextId}/documents`, token);
      setReviewDocuments((current) => ({ ...current, [nextId]: result.documents || [] }));
    } catch (e) {
      setError(`Could not load application documents: ${e.message}`);
    } finally {
      setDocumentsLoading(false);
    }
  }
  async function openDocument(fileRecord) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${fileRecord.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not open this file.');
      }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      setDocumentPreview({ url, name: fileRecord.originalFilename, mimeType: fileRecord.mimeType || file.type });
    } catch (e) { setError(e.message); }
  }
  function closeDocumentPreview() {
    if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
    setDocumentPreview(null);
  }
  async function reviewApplication(event) {
    event.preventDefault(); const form = readForm(event);
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/applications/${reviewId}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: form.status, comment: form.comment }) });
      setApplications((current) => current.map((item) => String(item.id) === String(reviewId) ? { ...item, ...result.application } : item));
      setReviewId(''); setNotice(result.emailSent
        ? 'Review saved. The parent received an in-app notification and email.'
        : 'Review saved and an in-app notification was sent. Email is waiting for Brevo SMTP credentials.');
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function sendDisciplineMessage(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = readForm(event);
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/admin/students/${disciplineStudentId}/discipline`, token, {
        method: 'POST', body: JSON.stringify({ message: form.message })
      });
      setNotice(result.emailSent
        ? `In-app notification and email sent to ${result.parentEmail}.`
        : `In-app notification sent to ${result.parentEmail}. Email is waiting for the Brevo SMTP login and key in backend/.env.`);
      formElement.reset();
      setDisciplineStudentId('');
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function sendStudentNotice(event) {
    event.preventDefault();
    const message = studentNotice.trim();
    if (!message || !selectedStudentIds.length) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api('/admin/notifications', token, { method: 'POST', body: JSON.stringify({ studentIds: selectedStudentIds, message }) });
      setNotice(`Notice sent to ${result.sentCount} L3 student families.`);
      setSelectedStudentIds([]); setStudentNotice('');
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function assignStudentToParent(event) {
    event.preventDefault();
    if (!assignStudentId || !assignParentId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/admin/students/${assignStudentId}/parent`, token, {
        method: 'PATCH', body: JSON.stringify({ parentId: assignParentId })
      });
      const student = students.find((item) => String(item.id) === String(assignStudentId));
      const parent = parents.find((item) => String(item.id) === String(assignParentId));
      setNotice(result.unchanged
        ? `${student?.fullName || 'Student'} is already assigned to ${parent?.fullName || 'that parent'}.`
        : `${student?.fullName || 'Student'} assigned to ${parent?.fullName || 'the parent'}. They can now see the student in their account.`);
      setAssignStudentId(''); setAssignParentId('');
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function createAnnouncement(event) {
    event.preventDefault(); const form = readForm(event);
    await action(async () => { const result = await api('/announcements', token, { method: 'POST', body: JSON.stringify({ title: form.title, content: form.content, publish: form.publish === 'on' }) }); setAnnouncementForm(false); return result; }, (result) => {
      if (form.publish !== 'on') return 'Announcement saved as a draft.';
      if (!result.emailRecipientCount) return 'Announcement published to parents.';
      return result.emailSentCount === result.emailRecipientCount
        ? `Announcement published and emailed to ${result.emailSentCount} parents.`
        : `Announcement published; email sent to ${result.emailSentCount} of ${result.emailRecipientCount} parents. Check Brevo SMTP settings.`;
    });
  }
  async function publishAnnouncement(item) {
    await action(() => api(`/announcements/${item.id}/publish`, token, { method: 'PATCH', body: JSON.stringify({ published: !item.isPublished }) }), (result) => {
      if (item.isPublished) return 'Announcement unpublished.';
      if (!result.emailRecipientCount) return 'Announcement published to parents.';
      return result.emailSentCount === result.emailRecipientCount
        ? `Announcement published and emailed to ${result.emailSentCount} parents.`
        : `Announcement published; email sent to ${result.emailSentCount} of ${result.emailRecipientCount} parents. Check Brevo SMTP settings.`;
    });
  }
  async function openThread(id) {
    setConversationId(id); setError('');
    try { const result = await api(`/messages/${id}`, token); setThread(result.messages || []); }
    catch (e) { setError(e.message); }
  }
  async function reply(event) {
    event.preventDefault(); const formElement = event.currentTarget; const form = readForm(event);
    await action(async () => { const sent = await api(`/messages/${conversationId}`, token, { method: 'POST', body: JSON.stringify(form) }); const result = await api(`/messages/${conversationId}`, token); setThread(result.messages || []); formElement.reset(); return sent; }, (result) => result.emailSent ? 'Reply sent and emailed to the parent.' : 'Reply sent in the portal. Parent email is waiting for Brevo SMTP credentials.');
  }
  async function markRead(item) {
    if (item.readAt) return;
    await action(() => api(`/notifications/${item.id}/read`, token, { method: 'PATCH' }), 'Notification marked as read.');
  }
  async function exportReport() {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reports/admissions?format=csv`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not download the report.');
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = 'admission-report.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }
  async function signOut() { await logout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }
  const stats = dashboard.statistics || {};
  const unreadNotifications = notifications.filter((item) => !item.readAt).length;
  const unreadMessages = Number(stats.unreadMessages || 0);
  const visibleApplications = useMemo(() => applications.filter((item) => (statusFilter === 'ALL' || item.status === statusFilter) && (!search || [item.studentName, item.parentName, item.referenceNumber, item.parentEmail].some((value) => value?.toLowerCase().includes(search.toLowerCase())))), [applications, statusFilter, search]);
  const visibleStudents = useMemo(() => students.filter((item) => (!studentTrade || item.schoolClass === studentTrade) && (studentLevel === 'ALL' || item.level === studentLevel) && (!search || [item.fullName, item.parentName, item.parentEmail, item.schoolClass].some((value) => value?.toLowerCase().includes(search.toLowerCase())))), [students, search, studentTrade, studentLevel]);
  const selectedDisciplineStudent = students.find((student) => String(student.id) === disciplineStudentId);
  const selectedAssignStudent = students.find((student) => String(student.id) === assignStudentId);
  const visibleParents = useMemo(() => parents.filter((item) => !search || [item.fullName, item.email, item.phone].some((value) => value?.toLowerCase().includes(search.toLowerCase()))), [parents, search]);
  const navigate = (name) => { setPage(name); setSearch(''); setError(''); setNotice(''); if (name !== 'Students') { setSelectedStudentIds([]); setStudentTrade(''); } };

  return <div className="head-dashboard">
    <aside className="head-sidebar"><a className="head-brand" href="/" data-route><b>BTR</b><span>RWAMIKO<small>HEADTEACHER PORTAL</small></span></a><small className="head-nav-label">SCHOOL MANAGEMENT</small>
      <nav className="head-nav">{pages.map((name) => <button key={name} className={page === name ? 'active' : ''} onClick={() => navigate(name)}><span><HeadIcon name={icons[name]} /></span>{name}{name === 'Messages' && unreadMessages > 0 && <i>{unreadMessages}</i>}{name === 'Notifications' && unreadNotifications > 0 && <i>{unreadNotifications}</i>}</button>)}</nav>
      <div className="head-profile"><span>{user.fullName?.[0]?.toUpperCase()}</span><div><b>{user.fullName}</b><small>Headteacher</small></div><button onClick={signOut} title="Log out">?</button></div>
    </aside>
    <main className="head-content"><header className="head-topbar"><div><small>BTR RWAMIKO TSS Â· MANAGEMENT</small><h1>{page}</h1></div><button className="head-refresh" onClick={refresh}>Refresh</button></header>
      {error && <div className="head-flash error" role="alert">{error}<button onClick={() => setError('')}>Ã—</button></div>}{notice && <div className="head-flash success" role="status">{notice}<button onClick={() => setNotice('')}>Ã—</button></div>}
      {loading ? <div className="head-loading">Loading school data...</div> : <>
        {page === 'Dashboard' && <>
          <section className="head-welcome"><div><small>SCHOOL OVERVIEW</small><h2>Welcome back,<br /><em>{user.fullName?.split(' ')[0]}.</em></h2><p>Welcome back to BTR Rwamiko TSS.</p></div><div className="head-welcome-mark"><HeadIcon name="chart" /></div></section>
          <section className="head-stats"><Stat label="PARENTS" value={stats.parents} icon="parents" onClick={() => navigate('Parents')} /><Stat label="STUDENTS" value={stats.students} icon="students" onClick={() => navigate('Students')} /><Stat label="APPLICATIONS" value={stats.applications} icon="file" onClick={() => navigate('Applications')} /><Stat label="PENDING REVIEW" value={stats.pending} icon="news" onClick={() => { navigate('Applications'); setStatusFilter('PENDING'); }} /></section>
          <div className="head-dashboard-grid"><section className="head-panel"><PanelTitle eyebrow="ADMISSIONS" title="Recent applications" action="Review all" onClick={() => navigate('Applications')} />{applications.slice(0, 6).map((item) => <AppRow key={item.id} item={item} onReview={() => { setPage('Applications'); openReview(item.id); }} />)}{!applications.length && <p className="head-muted">No applications have been submitted yet.</p>}</section><section className="head-panel"><PanelTitle eyebrow="SCHOOL ACTIVITY" title="Recent activity" />{(dashboard.recentActivity || []).map((item) => <article className="activity-row" key={item.id}><span className="activity-dot"/><div><b>{activityText(item.action)}</b><p>{item.userName || 'School system'} | {dateText(item.createdAt)}</p></div></article>)}{!dashboard.recentActivity?.length && <p className="head-muted">Recent school activity will appear here.</p>}</section></div>
          <section className="head-panel"><PanelTitle eyebrow="PARENT UPDATES" title="Latest announcements" action="Manage announcements" onClick={() => navigate('Announcements')} />{announcements.slice(0, 3).map((item) => <AnnouncementCard key={item.id} item={item} onPublish={() => publishAnnouncement(item)} />)}{!announcements.length && <p className="head-muted">No announcements yet.</p>}</section>
          <Notifications items={notifications.slice(0, 4)} onRead={markRead} />
        </>}

        {page === 'Applications' && <section className="head-panel">
          <PanelTitle eyebrow="ADMISSIONS" title="Application review" description="Search applications and update their status." />
          <div className="head-filters"><input aria-label="Search applications" placeholder="Search student, parent, or reference" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option>{['PENDING','UNDER_REVIEW','REQUIRES_CORRECTION','ACCEPTED','REJECTED','CANCELLED'].map((v) => <option key={v} value={v}>{labelStatus(v)}</option>)}</select></div>
          <div className="head-table"><div className="head-table-head apps"><span>STUDENT / PARENT</span><span>REFERENCE</span><span>INTAKE / CLASS</span><span>SUBMITTED</span><span>STATUS</span><span>ACTION</span></div>
            {visibleApplications.map((item) => <div className="head-app-wrap" key={item.id}>
              <AppRow item={item} detailed onReview={() => openReview(item.id)} />
              {reviewId === String(item.id) && <>
                <section className="review-documents"><h3>Application documents</h3>{documentsLoading && !reviewDocuments[item.id] ? <p>Loading submitted files...</p> : reviewDocuments[item.id]?.length ? <ul>{reviewDocuments[item.id].map((doc) => <li key={doc.id}><span><b>{doc.documentType.replaceAll('_', ' ')}</b><small>{doc.originalFilename}</small></span><button type="button" onClick={() => openDocument(doc)}>View on screen</button></li>)}</ul> : <p>No supporting documents were uploaded for this application.</p>}</section>
                {['ACCEPTED', 'CANCELLED'].includes(item.status) ? <div className="review-readonly">Final decision: {labelStatus(item.status)}{item.decisionComment && <p>Note: {item.decisionComment}</p>}</div> : <form className="review-form" onSubmit={reviewApplication}><label>Review outcome<select name="status" defaultValue={['PENDING','UNDER_REVIEW','REJECTED'].includes(item.status) ? 'UNDER_REVIEW' : item.status}><option value="UNDER_REVIEW">Under review</option><option value="REQUIRES_CORRECTION">Request correction</option><option value="ACCEPTED">Accept</option><option value="REJECTED">Reject</option></select></label><label>Note to parent<textarea name="comment" rows="2" maxLength="2000" defaultValue={item.decisionComment || ''} placeholder="Required for corrections and rejections" /></label><div><button type="button" onClick={() => { setReviewId(''); refresh(); }}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Save review'}</button></div></form>}
              </>}
            </div>)}
            {!visibleApplications.length && <EmptyPanel text="No applications match these filters." />}
          </div>
        </section>}

        {page === 'Public Applications' && <section className="head-panel"><PanelTitle eyebrow="PUBLIC ADMISSIONS" title="Public applications" description="Review requests submitted from the school homepage. Accepted requests can be converted into parent and student records." /><div className="head-public-admissions">{publicAdmissions.map((item) => <article className="head-public-admission" key={item.id}><header><div><small>{item.referenceNumber} · {dateText(item.submittedAt)}</small><h3>{item.studentName}</h3></div><em className={'status-' + (item.status || 'pending').toLowerCase()}>{labelStatus(item.status)}</em></header><div className="head-public-details"><p><b>Parent:</b> {item.parentName} · {item.parentEmail} {item.parentPhone && '· ' + item.parentPhone}</p><p><b>Trade:</b> {item.requestedClass} · <b>Date of birth:</b> {dateText(item.dateOfBirth)}</p><p><b>Previous school:</b> {item.previousSchool || 'Not provided'} · <b>Address:</b> {item.studentAddress || item.parentAddress || 'Not provided'}</p>{item.decisionComment && <p><b>School note:</b> {item.decisionComment}</p>}</div><div className="review-documents"><h3>Submitted documents</h3>{item.documents && item.documents.length ? <ul>{item.documents.map((doc) => <li key={doc.id}><span><b>{doc.documentType.replaceAll('_', ' ')}</b><small>{doc.originalFilename}</small></span><button type="button" onClick={() => openPublicDocument({ ...doc, requestId: item.id })}>View on screen</button></li>)}</ul> : <p>No supporting documents were uploaded.</p>}</div><footer>{item.status === 'PENDING' && <><button disabled={busy} onClick={() => reviewPublicAdmission(item.id, 'REJECTED')}>Reject</button><button disabled={busy} onClick={() => reviewPublicAdmission(item.id, 'ACCEPTED')}>Accept request</button></>}{item.status === 'ACCEPTED' && !item.parentUserId && <button disabled={busy} onClick={() => createPublicParentAccount(item.id)}>Create parent account &amp; student record</button>}{item.status === 'ACCEPTED' && item.parentUserId && <span>Parent account and student record created</span>}</footer></article>)}{!publicAdmissions.length && <EmptyPanel text="No public applications have been submitted yet." />}</div></section>}
        {page === 'Available Places' && <section className="head-panel"><PanelTitle eyebrow="YEARLY ADMISSION PLAN" title="Available places" description="Set the total places for each trade and level. Remaining places update as applications are accepted." /><div className="capacity-year-picker"><label>Admission year<select value={capacityYear} onChange={(event) => setCapacityYear(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - 1 + index).map((year) => <option key={year} value={year}>{year}</option>)}</select></label><p>Places are tracked separately for every year, trade, and level.</p></div><form className="capacity-edit-form" onSubmit={saveTradeCapacity}><h3>Set available places for {capacityYear}</h3><label>Trade<select name="requestedClass" value={capacityDraft.requestedClass} onChange={(event) => setCapacityDraft((current) => ({ ...current, requestedClass: event.target.value }))}>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><label>Level<select name="level" value={capacityDraft.level} onChange={(event) => setCapacityDraft((current) => ({ ...current, level: event.target.value }))}>{studentLevels.map((level) => <option key={level}>{level}</option>)}</select></label><label>Total places<input name="capacity" type="number" min="0" max="10000" step="1" value={capacityDraft.capacity} onChange={(event) => setCapacityDraft((current) => ({ ...current, capacity: event.target.value }))} required /></label><button disabled={busy}>{busy ? 'Saving...' : 'Save places'}</button></form><div className="head-table"><div className="head-table-head capacity-table-row"><span>TRADE</span><span>LEVEL</span><span>TOTAL PLACES</span><span>ENROLLED</span><span>REMAINING</span><span>ACTION</span></div>{capacities.map((item) => <div className="head-table-row capacity-table-row" key={item.id}><b>{item.requestedClass}</b><span>{item.level}</span><span>{item.capacity}</span><span>{item.enrolled}</span><strong className={item.remaining ? 'places-open' : 'places-full'}>{item.remaining}</strong><button onClick={() => setCapacityDraft({ requestedClass: item.requestedClass, level: item.level, capacity: String(item.capacity) })}>Edit places</button></div>)}{!capacities.length && <EmptyPanel text={`No places set for ${capacityYear}. Set the total places for each trade and level above.`} />}</div></section>}

        {page === 'Students' && <section className="head-panel">
          <PanelTitle eyebrow="STUDENT RECORDS" title="Students" description={`${students.length} accepted students currently enrolled.`} />
          <div className="trade-filter-list">
            <button aria-pressed={!studentTrade} className={!studentTrade ? 'active' : ''} onClick={() => { setStudentTrade(''); setStudentLevel('ALL'); setSelectedStudentIds([]); }}>All trades <i>{students.length}</i></button>
            {trades.map((trade) => <button key={trade} aria-pressed={studentTrade === trade} className={studentTrade === trade ? 'active' : ''} onClick={() => { setStudentTrade(trade); setStudentLevel('ALL'); setSelectedStudentIds([]); }}>{trade}<i>{students.filter((item) => item.schoolClass === trade).length}</i></button>)}
          </div>
          {studentTrade && <div className="trade-filter-list level-filter-list" aria-label={`Filter ${studentTrade} students by level`}>
            <button aria-pressed={studentLevel === 'ALL'} className={studentLevel === 'ALL' ? 'active' : ''} onClick={() => { setStudentLevel('ALL'); setSelectedStudentIds([]); }}>All levels <i>{students.filter((item) => item.schoolClass === studentTrade).length}</i></button>
            {studentLevels.map((level) => <button key={level} aria-pressed={studentLevel === level} className={studentLevel === level ? 'active' : ''} onClick={() => { setStudentLevel(level); setSelectedStudentIds([]); }}>{level}<i>{students.filter((item) => item.schoolClass === studentTrade && item.level === level).length}</i></button>)}
          </div>}
          <div className="head-filters"><input placeholder="Search students or parents" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {selectedStudentIds.length > 0 && <form className="student-notice-form" onSubmit={sendStudentNotice}><b>Send a notice to {selectedStudentIds.length} selected L3 student families</b><textarea value={studentNotice} onChange={(e) => setStudentNotice(e.target.value)} required maxLength="2000" rows="3" placeholder="Write a message for the selected families" /><div><button type="button" onClick={() => setSelectedStudentIds([])}>Clear selection</button><button disabled={busy}>{busy ? 'Sending...' : 'Send notice'}</button></div></form>}
          <div className="head-table">
            <div className="head-table-head people selectable"><span>STUDENT</span><span>DATE OF BIRTH</span><span>LEVEL</span><span>TRADE</span><span>PARENT / EMAIL</span><span>ACTION</span><span>SELECT (L3 ONLY)</span></div>
            {visibleStudents.map((item) => <div className="head-table-row people selectable" key={item.id}><b>{item.fullName}</b><span>{dateText(item.dateOfBirth)}</span><span>{item.level || '-'}</span><span>{item.schoolClass || '-'}</span><span>{item.parentName}<small className="student-parent-email">{item.parentEmail}</small></span><div className="student-row-actions"><button className="student-message-action" onClick={() => setDisciplineStudentId(String(item.id))}>Message parent</button><button className="student-message-action student-assign-action" onClick={() => { setAssignStudentId(String(item.id)); setAssignParentId(''); }}>Assign parent</button></div><label className="student-select"><input type="checkbox" disabled={item.level !== 'L3'} checked={selectedStudentIds.includes(String(item.id))} onChange={(event) => setSelectedStudentIds((ids) => event.target.checked ? [...ids, String(item.id)] : ids.filter((id) => id !== String(item.id)))} />{item.level === 'L3' ? 'Select' : 'L3 only'}</label></div>)}
            {!visibleStudents.length && <EmptyPanel text={studentTrade ? `No students found in ${studentTrade}${studentLevel !== 'ALL' ? ` ${studentLevel}` : ''}.` : 'No accepted students found.'} />}
          </div>
          {selectedAssignStudent && <form className="student-assign-form" onSubmit={assignStudentToParent}><h3>Assign {selectedAssignStudent.fullName} to a parent account</h3><p>That parent will be able to see this student and their application in their account.</p><label>Parent account<select value={assignParentId} onChange={(event) => setAssignParentId(event.target.value)} required><option value="" disabled>Select a parent</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.fullName} · {parent.email}{String(parent.id) === String(selectedAssignStudent.parentId) ? ' (current parent)' : ''}</option>)}</select></label><div><button type="button" onClick={() => { setAssignStudentId(''); setAssignParentId(''); }}>Cancel</button><button disabled={busy}>{busy ? 'Assigning...' : 'Assign student'}</button></div></form>}
          {selectedDisciplineStudent && <form className="discipline-form" onSubmit={sendDisciplineMessage}><div><h3>Discipline notice for {selectedDisciplineStudent.fullName}</h3><p>This message will appear in {selectedDisciplineStudent.parentName}'s notifications and be emailed to {selectedDisciplineStudent.parentEmail}.</p></div><label>Message<textarea name="message" required maxLength="2000" rows="4" placeholder="Describe the concern and any action requested." /></label><div><button type="button" onClick={() => setDisciplineStudentId('')}>Cancel</button><button disabled={busy}>{busy ? 'Sending...' : 'Send notice'}</button></div></form>}
        </section>}
        {page === 'Notifications' && <Notifications items={notifications} onRead={markRead} />}

        {page === 'Parents' && <section className="head-panel"><PanelTitle eyebrow="FAMILY ACCOUNTS" title="Parents" description={`${parents.length} parent accounts registered.`} /><div className="head-filters"><input placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="head-table"><div className="head-table-head parent-rows"><span>PARENT</span><span>EMAIL</span><span>PHONE</span><span>CHILDREN</span><span>JOINED</span></div>{visibleParents.map((item) => <div className="head-table-row parent-rows" key={item.id}><b>{item.fullName}</b><span>{item.email}</span><span>{item.phone || '-'}</span><span>{item.studentCount}</span><span>{dateText(item.createdAt)}</span></div>)}{!visibleParents.length && <EmptyPanel text="No parent accounts found." />}</div></section>}

        {page === 'Announcements' && <section className="head-panel"><PanelTitle eyebrow="SCHOOL NEWS" title="Announcements" description="Create a draft or publish a message to parent accounts." action={announcementForm ? 'Close' : '+ New announcement'} onClick={() => setAnnouncementForm(!announcementForm)} />{announcementForm && <form className="head-compose" onSubmit={createAnnouncement}><label>Title<input name="title" required maxLength="200" /></label><label>Announcement<textarea name="content" rows="5" required maxLength="20000" /></label><label className="publish-check"><input type="checkbox" name="publish" defaultChecked /> Publish now and notify parents</label><button disabled={busy}>{busy ? 'Saving...' : 'Save announcement'}</button></form>}{announcements.map((item) => <AnnouncementCard key={item.id} item={item} onPublish={() => publishAnnouncement(item)} />)}{!announcements.length && !announcementForm && <EmptyPanel text="No announcements yet. Create the first school update." />}</section>}

        {page === 'Messages' && <section className="head-panel"><PanelTitle eyebrow="PARENT COMMUNICATION" title="Messages" description="Read and reply to parent conversations." /><div className="head-messages"><div className="head-conversations">{conversations.map((item) => <button key={item.conversationId} className={conversationId === item.conversationId ? 'selected' : ''} onClick={() => openThread(item.conversationId)}><b>{item.otherParticipant}</b><small>{dateText(item.lastMessageAt)}</small>{Number(item.unreadCount) > 0 && <i>{item.unreadCount}</i>}</button>)}{!conversations.length && <p className="head-muted">No parent messages yet.</p>}</div><div className="head-thread">{conversationId ? <><div className="head-thread-messages">{thread.map((item) => <article key={item.id}><small>{item.senderName} | {dateText(item.sentAt)}</small><p>{item.content}</p></article>)}</div><form className="head-reply" onSubmit={reply}><textarea name="content" required maxLength="5000" rows="2" placeholder="Write a reply..."/><button disabled={busy}>Send reply</button></form></> : <div className="head-muted">Choose a conversation to view and reply.</div>}</div></div></section>}

        {page === 'Reports' && <><section className="head-panel"><PanelTitle eyebrow="ADMISSIONS INSIGHTS" title="Reports" description="Overview of application outcomes and requested classes." action="Download CSV" onClick={exportReport} /><div className="report-grid"><div><h3>Applications by status</h3>{report.applicationsByStatus.map((row) => <ReportBar key={row.status} label={labelStatus(row.status)} value={row.count} total={Number(stats.applications || 0)} />)}</div><div><h3>Applications by class</h3>{report.applicationsByClass.map((row) => <ReportBar key={row.requestedClass} label={row.requestedClass} value={row.count} total={Number(stats.applications || 0)} />)}</div></div>{!stats.applications && <p className="head-muted">Reports will appear after applications are submitted.</p>}<section className="activity-log-report"><header><div><small>SCHOOL HISTORY</small><h3>All activity logs</h3></div><span>{activityLogs.length} records</span></header>{activityLogs.length ? <div className="activity-log-list">{activityLogs.map((item) => <article key={item.id}><div className="activity-log-main"><b>{activityText(item.action)}</b><p>{[item.userName || "School system", item.entityType, item.entityId ? "#" + item.entityId : ""].filter(Boolean).join(" / ")}</p></div><time>{dateText(item.createdAt)}</time>{item.details && Object.keys(item.details).length > 0 && <pre>{JSON.stringify(item.details, null, 2)}</pre>}</article>)}</div> : <p className="head-muted">No activity has been logged yet.</p>}</section></section></>}
      </>}
      {documentPreview && <div className="document-preview-backdrop" role="presentation" onClick={closeDocumentPreview}><section className="document-preview" role="dialog" aria-modal="true" aria-label={documentPreview.name} onClick={(event) => event.stopPropagation()}><header><b>{documentPreview.name}</b><button type="button" onClick={closeDocumentPreview} aria-label="Close document preview">x</button></header>{documentPreview.mimeType?.startsWith('image/') ? <img src={documentPreview.url} alt={documentPreview.name} /> : <iframe src={documentPreview.url} title={documentPreview.name} />}</section></div>}
      <footer className="head-footer"><span>BTR Rwamiko TSS</span><span>School management portal</span></footer>
    </main>
  </div>;
}

function Stat({ label, value, icon, onClick }) { return <button className="head-stat" onClick={onClick}><span><HeadIcon name={icon}/></span><small>{label}</small><strong>{String(value || 0).padStart(2, '0')}</strong><i>View details</i></button>; }
function PanelTitle({ eyebrow, title, description, action, onClick }) { return <header className="head-panel-title"><div><small>{eyebrow}</small><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button onClick={onClick}>{action}</button>}</header>; }
function AppRow({ item, detailed = false, onReview }) { return <div className={`head-app-row ${detailed ? 'detailed' : ''}`}><div><b>{item.studentName}</b>{!detailed && <small>{item.parentName} · {item.requestedClass}</small>}{detailed && <small>{item.parentName} · {item.parentEmail}</small>}</div>{detailed && <><span>{item.referenceNumber}</span><span>{item.admissionYear} · {item.requestedClass}</span><span>{dateText(item.submittedAt)}</span></>}<em className={`status-${(item.status || 'pending').toLowerCase()}`}>{labelStatus(item.status)}</em><button onClick={onReview}>{detailed ? (['ACCEPTED', 'REJECTED'].includes(item.status) ? 'View review' : 'Review') : 'Open'}</button>{item.decisionComment && detailed && <p className="head-decision-note">Note: {item.decisionComment}</p>}</div>; }
function AnnouncementCard({ item, onPublish }) { return <article className="head-announcement"><div><small>{item.isPublished ? `Published ${dateText(item.publishedAt)}` : `Draft Â· ${dateText(item.createdAt)}`}</small><h3>{item.title}</h3><p>{item.content}</p></div><button className={item.isPublished ? 'unpublish' : ''} onClick={onPublish}>{item.isPublished ? 'Unpublish' : 'Publish'}</button></article>; }
function Notifications({ items, onRead }) { return <section className="head-panel"><PanelTitle eyebrow="ACCOUNT ACTIVITY" title="Notifications" />{items.length ? items.map((item) => <button key={item.id} className={`head-notification ${item.readAt ? '' : 'unread'}`} onClick={() => onRead(item)}><span>?</span><b>{item.message}</b><small>{dateText(item.createdAt)}</small></button>) : <p className="head-muted">Youâ€™re all caught up.</p>}</section>; }
function ReportBar({ label, value, total }) { const count = Number(value || 0); return <div className="report-bar"><div><span>{label}</span><b>{count}</b></div><i><span style={{ width: `${total ? Math.max(3, count / total * 100) : 0}%` }} /></i></div>; }
function EmptyPanel({ text }) { return <p className="head-empty">{text}</p>; }
function activityText(action) { return (action || 'SCHOOL_UPDATE').replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()); }




