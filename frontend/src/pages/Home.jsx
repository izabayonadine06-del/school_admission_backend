import React, { useState } from 'react';

const programs = [
  { number: '01', name: 'Software Development', category: 'ICT & DIGITAL', mark: '</>' },
  { number: '02', name: 'Networking', category: 'ICT & DIGITAL', mark: '⌘' },
  { number: '03', name: 'Computer Systems', category: 'ICT & DIGITAL', mark: '▣' },
  { number: '04', name: 'Accounting', category: 'BUSINESS', mark: '∑' },
  { number: '05', name: 'Building Construction', category: 'ENGINEERING', mark: '⌂' },
  { number: '06', name: 'Electronics & Electricity', category: 'ENGINEERING', mark: 'ϟ' },
];

function Arrow({ diagonal = false }) { return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>; }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <div className="site-shell">
    <div className="topline"><span>RWAMIKO · RWANDA</span><span>LEARN BY DOING. BUILD WHAT’S NEXT.</span></div>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="BTR Rwamiko TSS home" onClick={closeMenu}><span className="brand-mark"><span>BTR</span><i /></span><span className="brand-name">RWAMIKO <small>TECHNICAL SECONDARY SCHOOL</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        <a href="#programs" onClick={closeMenu}>Our programs</a><a href="#approach" onClick={closeMenu}>Our approach</a><a href="#admissions" onClick={closeMenu}>Admissions</a>
        <a href="/login" data-route onClick={closeMenu}>Login</a><a className="nav-cta" href="/apply" data-route onClick={closeMenu}>Apply <Arrow diagonal /></a>
      </nav>
    </header>
    <main>
      <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> TECHNICAL SKILLS. REAL POSSIBILITIES.</div><h1>Learn a skill.<br />Shape your <em>future.</em></h1><p className="hero-description">A place to build practical knowledge, discover your strengths, and prepare for the world of work.</p><div className="hero-actions"><a className="button button-dark" href="#programs">Explore our programs <Arrow /></a><a className="text-link" href="#approach">Discover BTR <Arrow diagonal /></a></div><div className="hero-note"><span className="note-line" /><span>Technical and vocational education<br />in Rwamiko, Rwanda</span></div></div>
        <div className="hero-visual" aria-label="Campus illustration"><div className="visual-grid" /><div className="photo-placeholder"><div className="sky-orb" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="campus-building"><div className="roof" /><div className="building-body"><div className="building-sign">BTR <small>RWAMIKO TSS</small></div><div className="window-row"><i/><i/><i/><i/></div><div className="window-row lower"><i/><i/><i/><i/></div></div><div className="building-door" /></div><div className="plant plant-one"><i/><i/><i/></div><div className="plant plant-two"><i/><i/><i/></div><div className="image-label"><span className="image-label-icon">✳</span><span><b>YOUR SCHOOL, YOUR STORY</b><small>Campus photo coming soon</small></span></div></div><div className="visual-stamp"><span>LEARN</span><b>↗</b><span>CREATE</span></div><div className="visual-caption">BTR RWAMIKO TSS <span>·</span> RWANDA</div></div>
      </section>
      <section className="program-section" id="programs"><div className="section-heading"><div><div className="eyebrow muted"><span className="eyebrow-dot" /> FIND YOUR PATH</div><h2>Skills that move<br className="desktop-break" /> you <em>forward.</em></h2></div><p>Explore practical programs across technology, business, construction, and electrical trades.</p></div><div className="program-grid">{programs.map((program) => <a className="program-card" href="/apply" data-route key={program.number}><div className="program-top"><span>{program.number} <i>—</i> {program.category}</span><span className="program-arrow"><Arrow diagonal /></span></div><div className="program-mark" aria-hidden="true">{program.mark}</div><h3>{program.name}</h3><div className="program-bottom"><span>Apply for this trade</span><Arrow /></div></a>)}</div><div className="program-foot"><span>01 — 06</span><span>Choose a direction. Start building.</span><span className="foot-rule" /></div></section>
      <section className="approach-section" id="approach"><div className="approach-art" aria-label="Workshop illustration"><div className="art-sun" /><div className="art-grid" /><div className="workbench"><span className="bench-top"/><span className="bench-leg left"/><span className="bench-leg right"/><span className="tool tool-a"/><span className="tool tool-b"/><span className="tool tool-c"/></div><div className="art-note"><span>✳</span> LEARNING IN ACTION</div><div className="art-placeholder-label">Workshop photo coming soon</div></div><div className="approach-copy"><div className="eyebrow"><span className="eyebrow-dot" /> MORE THAN A CLASSROOM</div><h2>Knowledge you<br />can <em>put to work.</em></h2><p>Build a strong foundation through hands-on learning and a focus on skills you can use in the real world.</p><a className="button button-outline" href="#admissions">Get to know us <Arrow diagonal /></a><div className="approach-index"><span>OUR APPROACH</span><span>01 / 03</span></div></div></section>
      <section className="admissions-section" id="admissions"><div className="admissions-pattern" /><div className="admissions-content"><div className="eyebrow light"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER</div><h2>Ready to make<br />something <em>of it?</em></h2><p>Take the first step toward a practical education at BTR Rwamiko TSS.</p><a className="button button-light" href="/apply" data-route>Apply now <Arrow diagonal /></a></div><div className="admissions-side"><span className="side-number">BTR</span><span>RWAMIKO<br />TECHNICAL<br />SECONDARY SCHOOL</span><i /></div></section>
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><span>BTR</span><i /></span><span className="brand-name">RWAMIKO <small>TECHNICAL SECONDARY SCHOOL</small></span></a><span className="footer-motto">PRACTICAL LEARNING. LASTING SKILLS.</span><a className="back-top" href="#home">BACK TO TOP <span>↑</span></a><div className="footer-bottom"><span>© BTR Rwamiko TSS</span><span>Rwamiko, Rwanda</span><span>Built for what comes next.</span></div></footer>
  </div>;
}
