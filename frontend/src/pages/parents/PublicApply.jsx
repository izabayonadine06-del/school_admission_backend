import React, { useState } from 'react';
import { API_BASE_URL } from '../../auth.js';
import { LanguagePicker, useLanguage } from '../../language.js';

const trades = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];

export default function PublicApply() {
  const [language, setLanguage] = useLanguage();
  const rw = language === 'rw';
  const t = rw ? {
    home: 'Garuka ku rubuga rw’ishuri', parent: 'Amakuru y’umubyeyi', student: 'Ubusabe bw’umunyeshuri', intro: 'Saba kwiga udafunguye konti. Umuyobozi w’ishuri azasuzuma ubusabe bwawe akumenyeshe kuri imeyili.', name: 'Amazina y’umubyeyi cyangwa umurera', email: 'Imeyili', phone: 'Telefoni', address: 'Aderesi', next: 'Komeza ku makuru y’umunyeshuri', edit: 'Hindura', studentName: 'Amazina y’umunyeshuri', birth: 'Itariki y’amavuko', gender: 'Igitsina', studentAddress: 'Aderesi y’umunyeshuri', previous: 'Ishuri yigagaho', places: 'Reba imyanya ihari', close: 'Funga imyanya ihari', live: 'IMYANYA YO KWIGA IHARI', loading: 'Turimo kureba imyanya ihari…', trade: 'Umwuga / porogaramu', level: 'Umwaka', total: 'Imyanya yose', enrolled: 'Abamaze kwiyandikisha', remaining: 'Isigaye', full: 'Yuzuye', noPlacesSet: 'Ishuri ntirirashyiraho imyanya ihari muri uyu mwaka.', loadingTrades: 'Turimo kureba imyuga ihari…', selectTrade: 'Hitamo umwuga urimo imyanya', selectLevel: 'Hitamo umwaka urimo imyanya', noneAvailable: 'Nta myanya yo gusabiraho ihari muri uyu mwaka. Hamagara ishuri.', result: 'Ibisubizo byo mu ishuri ribanza', transfer: 'Ibaruwa yo kwimuka', photo: 'Ifoto y’umunyeshuri', national: 'Ibisubizo by’ikizamini cya leta', submit: 'Ohereza ubusabe', sending: 'Turimo kohereza…'
  } : {
    home: 'Back to school home', parent: 'Parent information', student: 'Student application', intro: 'Apply without creating an account. A headteacher will review your request and contact you by email.', name: 'Parent or guardian name', email: 'Email', phone: 'Phone', address: 'Address', next: 'Continue to student details', edit: 'Edit', studentName: 'Student full name', birth: 'Date of birth', gender: 'Gender', studentAddress: 'Student address', previous: 'Previous school', places: 'View available places', close: 'Close available places', live: 'LIVE ADMISSION PLACES', loading: 'Loading available places…', trade: 'Trade / program', level: 'Level', total: 'Total places', enrolled: 'Enrolled', remaining: 'Remaining', full: 'Full', noPlacesSet: 'The school has not set available places for this year yet.', loadingTrades: 'Loading available trades…', selectTrade: 'Select a trade with places', selectLevel: 'Select an available level', noneAvailable: 'No places are currently available for applications this year. Please contact the school.', result: 'Previous school result', transfer: 'Transfer document', photo: 'Student photo', national: 'National exam result', submit: 'Submit application', sending: 'Submitting…'
  };
  const [step, setStep] = useState(1);
  const [parent, setParent] = useState({ fullName: '', email: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showCapacity, setShowCapacity] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [capacities, setCapacities] = useState([]);
  const [capacitiesLoaded, setCapacitiesLoaded] = useState(false);
  const [capacityError, setCapacityError] = useState('');
  const [requestedClass, setRequestedClass] = useState('');
  const [level, setLevel] = useState('');

  async function loadCapacities() {
    if (capacitiesLoaded || capacityLoading) return;
    setCapacityLoading(true);
    setCapacityError('');
    try {
      const year = new Date().getFullYear();
      const response = await fetch(`${API_BASE_URL}/public-admissions/capacities?year=${year}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not load available places.');
      setCapacities(result.capacities || []);
      setCapacitiesLoaded(true);
    } catch (error) { setCapacityError(error.message); }
    finally { setCapacityLoading(false); }
  }

  function toggleAvailablePlaces() {
    if (showCapacity) { setShowCapacity(false); return; }
    setShowCapacity(true);
    loadCapacities();
  }
  function continueToStudent(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setParent(values);
    setStep(2);
    loadCapacities();
  }

  const availableTrades = [...new Set(capacities.filter((item) => Number(item.remaining) > 0).map((item) => item.requestedClass))];
  const availableLevels = capacities.filter((item) => item.requestedClass === requestedClass && Number(item.remaining) > 0);

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
      setMessage(rw ? `Ubusabe bwawe bwakiriwe neza. Nimero yabwo ni ${result.referenceNumber}. Ishuri rizakumenyesha rimaze kubusuzuma.` : `Your application was received successfully. Reference: ${result.referenceNumber}. The school will contact ${parent.email} after review.`);
      submittedForm.reset();
      setParent({ fullName: '', email: '', phone: '', address: '' });
      setStep(1);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <main className="account-page public-apply-page"><section className="account-card public-apply-card">
    <LanguagePicker language={language} onChange={setLanguage} />
    <a href="/" data-route>Ã¢â€ Â {rw ? 'Garuka ku ishuri' : 'Back to school home'}</a>
    <p className="eyebrow">BTR RWAMIKO TSS Ã‚Â· ADMISSIONS</p><h1>{step === 1 ? t.parent : t.student}</h1>
    <p>{t.intro}</p>
    {message && <p role="status">{message}</p>}
    {step === 1 ? <form onSubmit={continueToStudent} className="public-apply-form">
      <label>{t.name}<input name="fullName" required minLength="2" maxLength="160" defaultValue={parent.fullName}/></label>
      <label>{t.email}<input name="email" type="email" required maxLength="254" defaultValue={parent.email}/></label>
      <label>{t.phone}<input name="phone" type="tel" maxLength="32" defaultValue={parent.phone}/></label>
      <label>{t.address}<textarea name="address" maxLength="2000" defaultValue={parent.address}/></label>
      <button type="submit">{t.next} Ã¢â€ â€™</button>
    </form> : <form onSubmit={submitApplication} className="public-apply-form" encType="multipart/form-data">
      <p>Parent: <b>{parent.fullName}</b> Ã‚Â· {parent.email} <button type="button" onClick={() => setStep(1)}>{t.edit}</button></p>
      <label>{t.studentName}<input name="studentName" required minLength="2" maxLength="160"/></label>
      <label>{t.birth}<input name="dateOfBirth" type="date" required/></label>
      <label>{t.gender}<input name="gender" maxLength="30"/></label>
      <label>{t.studentAddress}<textarea name="studentAddress" maxLength="2000"/></label>
      <label>{t.previous}<input name="previousSchool" maxLength="200"/></label>
      <button type="button" className="parent-capacity-toggle public-capacity-toggle" onClick={toggleAvailablePlaces}>{showCapacity ? t.close : t.places}</button>
      {showCapacity && <section className="parent-capacity-board"><header><div><small>{t.live}</small><h3>Places available for {new Date().getFullYear()}</h3></div></header>{capacityLoading ? <p className="parent-capacity-empty">{t.loading}</p> : capacityError ? <p className="parent-capacity-empty">{capacityError}</p> : capacities.length ? <div className="parent-capacity-table-wrap"><table className="parent-capacity-table"><thead><tr><th>{t.trade}</th><th>{t.level}</th><th>{t.total}</th><th>{t.enrolled}</th><th>{t.remaining}</th></tr></thead><tbody>{capacities.map((item) => <tr key={item.id}><td>{item.requestedClass}</td><td>{item.level}</td><td>{item.capacity}</td><td>{item.enrolled}</td><td><strong className={Number(item.remaining) > 0 ? 'places-open' : 'places-full'}>{Number(item.remaining) > 0 ? item.remaining : t.full}</strong></td></tr>)}</tbody></table></div> : <p className="parent-capacity-empty">{t.noPlacesSet}</p>}</section>}
      <label>Trade / program<select name="requestedClass" value={requestedClass} onChange={(event) => { setRequestedClass(event.target.value); setLevel(""); }} required disabled={capacityLoading || !availableTrades.length}><option value="" disabled>{capacityLoading ? "Loading available trades..." : "Select a trade with places"}</option>{availableTrades.map((trade) => <option key={trade}>{trade}</option>)}</select></label>
      <label>Level<select name="level" value={level} onChange={(event) => setLevel(event.target.value)} required disabled={!requestedClass || !availableLevels.length}><option value="" disabled>{t.selectLevel}</option>{availableLevels.map((item) => <option key={item.level} value={item.level}>{item.level} - {item.remaining} places remaining</option>)}</select></label>
            {capacityError && <p className="account-error" role="alert">{capacityError}</p>}{!capacityLoading && !capacityError && !availableTrades.length && <p className="parent-capacity-empty">{t.noneAvailable}</p>}
      <label>{t.result}<input name="previousResult" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <label>{t.transfer}<input name="transferDocument" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <label>{t.photo}<input name="studentPhoto" type="file" accept="image/jpeg,image/png"/></label>
      <label>{t.national}<input name="nationalResult" type="file" accept=".pdf,.jpg,.jpeg,.png"/></label>
      <button type="submit" disabled={busy || capacityLoading || !availableLevels.some((item) => item.level === level)}>{busy ? 'SubmittingÃ¢â‚¬Â¦' : 'Submit application'}</button>
    </form>}
  </section></main>;
}
