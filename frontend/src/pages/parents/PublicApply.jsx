import React, { useState } from 'react';
import { API_BASE_URL } from '../../auth.js';

const trades = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];

export default function PublicApply() {
  const [step, setStep] = useState(1);
  const [parent, setParent] = useState({ fullName: '', email: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showCapacity, setShowCapacity] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [capacities, setCapacities] = useState([]);
  const [capacityError, setCapacityError] = useState('');

  async function toggleAvailablePlaces() {
    if (showCapacity) { setShowCapacity(false); return; }
    setShowCapacity(true);
    if (capacities.length || capacityLoading) return;
    setCapacityLoading(true);
    setCapacityError('');
    try {
      const year = new Date().getFullYear();
      const response = await fetch(`${API_BASE_URL}/public-admissions/capacities?year=${year}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not load available places.');
      setCapacities(result.capacities || []);
    } catch (error) { setCapacityError(error.message); }
    finally { setCapacityLoading(false); }
  }
  function continueToStudent(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setParent(values);
    setStep(2);
  }

  async function submitApplication(event) {
    event.preventDefault();
    const submittedForm = event.currentTarget;
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    Object.entries(parent).forEach(([key, value]) => form.append(`parent_${key}`, value));
    try {
      const response = await fetch(`${API_BASE_URL}/public-admissions`, { method: 'POST', body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit the application.');
      setMessage(`Your application was received successfully. Reference: ${result.referenceNumber}. The school will contact ${parent.email} after review.`);
      submittedForm.reset();
      setParent({ fullName: '', email: '', phone: '', address: '' });
      setStep(1);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <main className="account-page public-apply-page"><section className="account-card public-apply-card">
    <a href="/" data-route>â† Back to school home</a>
    <p className="eyebrow">BTR RWAMIKO TSS Â· ADMISSIONS</p><h1>{step === 1 ? 'Parent information' : 'Student application'}</h1>
    <p>Apply without creating an account. A headteacher will review your request and contact you by email.</p>
    {message && <p role="status">{message}</p>}
    {step === 1 ? <form onSubmit={continueToStudent} className="public-apply-form">
      <label>Parent or guardian name<input name="fullName" required minLength="2" maxLength="160" defaultValue={parent.fullName}/></label>
      <label>Email<input name="email" type="email" required maxLength="254" defaultValue={parent.email}/></label>
      <label>Phone<input name="phone" type="tel" maxLength="32" defaultValue={parent.phone}/></label>
      <label>Address<textarea name="address" maxLength="2000" defaultValue={parent.address}/></label>
      <button type="submit">Continue to student details â†’</button>
    </form> : <form onSubmit={submitApplication} className="public-apply-form" encType="multipart/form-data">
      <p>Parent: <b>{parent.fullName}</b> Â· {parent.email} <button type="button" onClick={() => setStep(1)}>Edit</button></p>
      <label>Student full name<input name="studentName" required minLength="2" maxLength="160"/></label>
      <label>Date of birth<input name="dateOfBirth" type="date" required/></label>
      <label>Gender<input name="gender" maxLength="30"/></label>
      <label>Student address<textarea name="studentAddress" maxLength="2000"/></label>
      <label>Previous school<input name="previousSchool" maxLength="200"/></label>
      <button type="button" className="parent-capacity-toggle public-capacity-toggle" onClick={toggleAvailablePlaces}>{showCapacity ? 'Close available places' : 'View available places'}</button>
      {showCapacity && <section className="parent-capacity-board"><header><div><small>LIVE ADMISSION PLACES</small><h3>Places available for {new Date().getFullYear()}</h3></div></header>{capacityLoading ? <p className="parent-capacity-empty">Loading available places...</p> : capacityError ? <p className="parent-capacity-empty">{capacityError}</p> : capacities.length ? <div className="parent-capacity-table-wrap"><table className="parent-capacity-table"><thead><tr><th>Trade</th><th>Level</th><th>Total places</th><th>Enrolled</th><th>Remaining</th></tr></thead><tbody>{capacities.map((item) => <tr key={item.id}><td>{item.requestedClass}</td><td>{item.level}</td><td>{item.capacity}</td><td>{item.enrolled}</td><td><strong className={Number(item.remaining) > 0 ? 'places-open' : 'places-full'}>{Number(item.remaining) > 0 ? item.remaining : 'Full'}</strong></td></tr>)}</tbody></table></div> : <p className="parent-capacity-empty">The school has not set available places for this year yet.</p>}</section>}
      <label>Trade / program<select name="requestedClass" required defaultValue=""><option value="" disabled>Select a trade</option>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label>
      <label>Level<select name="level" required defaultValue=""><option value="" disabled>Select a level</option>{['L3', 'L4', 'L5'].map((level) => <option key={level}>{level}</option>)}</select></label>
      <label>Previous school result<input name="previousResult" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <label>Transfer document<input name="transferDocument" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <label>Student photo<input name="studentPhoto" type="file" accept="image/jpeg,image/png"/></label>
      <label>National exam result<input name="nationalResult" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <button type="submit" disabled={busy}>{busy ? 'Submittingâ€¦' : 'Submit application'}</button>
    </form>}
  </section></main>;
}
