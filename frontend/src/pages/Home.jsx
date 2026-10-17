import React, { useState } from 'react';

const programs = [
  { number: '01', name: 'Software Development', category: 'ICT & DIGITAL', mark: '</>' },
  { number: '02', name: 'Networking', category: 'ICT & DIGITAL', mark: '⌘' },
  { number: '03', name: 'Computer Systems', category: 'ICT & DIGITAL', mark: '▣' },
  { number: '04', name: 'Accounting', category: 'BUSINESS', mark: '∑' },
  { number: '05', name: 'Building Construction', category: 'ENGINEERING', mark: '⌂' },
  { number: '06', name: 'Electronics & Electricity', category: 'ENGINEERING', mark: 'ϟ' },
];

const homeTranslations = {
 en:{language:'Language',programs:'Our programs',approach:'Our approach',admissions:'Admissions',login:'Login',apply:'Apply',heroTagline:'{t.heroTagline}</span></div>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="BTR Rwamiko TSS home" onClick={closeMenu}><span className="brand-mark"><span>BTR</span><i /></span><span className="brand-name">RWAMIKO <small>TECHNICAL SECONDARY SCHOOL</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        <a href="#programs" onClick={closeMenu}>{t.programs}</a><a href="#approach" onClick={closeMenu}>{t.approach}</a><a href="#admissions" onClick={closeMenu}>{t.admissions}</a>
        <a href="/login" data-route onClick={closeMenu}>{t.login}</a><label className="home-language-picker">{t.language}<select aria-label={t.language} value={language} onChange={(event) => { const value=event.target.value; setLanguage(value); localStorage.setItem('btr.parent.language',value); }}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label><a className="nav-cta" href="/apply" data-route onClick={closeMenu}>{t.apply} <Arrow diagonal /></a>
      </nav>
    </header>
    <main>
      <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> {t.eyebrow}</div><h1>{t.headline}<br />{t.future} <em>{t.futureWord}</em></h1><p className="hero-description">{t.description}</p><div className="hero-actions"><a className="button button-dark" href="#programs">{t.explore} <Arrow /></a><a className="text-link" href="#approach">{t.discover} <Arrow diagonal /></a></div><div className="hero-note"><span className="note-line" /><span>{t.schoolType}<br />{t.location}</span></div></div>
        <div className="hero-visual" aria-label="Campus illustration"><div className="visual-grid" /><div className="photo-placeholder"><div className="sky-orb" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="campus-building"><div className="roof" /><div className="building-body"><div className="building-sign">BTR <small>RWAMIKO TSS</small></div><div className="window-row"><i/><i/><i/><i/></div><div className="window-row lower"><i/><i/><i/><i/></div></div><div className="building-door" /></div><div className="plant plant-one"><i/><i/><i/></div><div className="plant plant-two"><i/><i/><i/></div><div className="image-label"><span className="image-label-icon">✳</span><span><b>{t.story}</b><small>{t.photo}</small></span></div></div><div className="visual-stamp"><span>{t.learn}</span><b>↗</b><span>{t.create}</span></div><div className="visual-caption">BTR RWAMIKO TSS <span>·</span> RWANDA</div></div>
      </section>
      <section className="program-section" id="programs"><div className="section-heading"><div><div className="eyebrow muted"><span className="eyebrow-dot" /> {t.findPath}</div><h2>{t.skills}<br className="desktop-break" /> {t.forward}</h2></div><p>{t.programDescription}</p></div><div className="program-grid">{programs.map((program) => <a className="program-card" href="/apply" data-route key={program.number}><div className="program-top"><span>{program.number} <i>—</i> {t.categories[Number(program.number)-1]}</span><span className="program-arrow"><Arrow diagonal /></span></div><div className="program-mark" aria-hidden="true">{program.mark}</div><h3>{t.programNames[Number(program.number)-1]}</h3><div className="program-bottom"><span>{t.applyTrade}</span><Arrow /></div></a>)}</div><div className="program-foot"><span>01 — 06</span><span>{t.choose}</span><span className="foot-rule" /></div></section>
      <section className="approach-section" id="approach"><div className="approach-art" aria-label="Workshop illustration"><div className="art-sun" /><div className="art-grid" /><div className="workbench"><span className="bench-top"/><span className="bench-leg left"/><span className="bench-leg right"/><span className="tool tool-a"/><span className="tool tool-b"/><span className="tool tool-c"/></div><div className="art-note"><span>✳</span> {t.learning}</div><div className="art-placeholder-label">{t.workshop}</div></div><div className="approach-copy"><div className="eyebrow"><span className="eyebrow-dot" /> {t.more}</div><h2>{t.knowledge}<br />{t.work} <em>{t.putToWork}</em></h2><p>{t.approachDescription}</p><a className="button button-outline" href="#admissions">{t.knowUs} <Arrow diagonal /></a><div className="approach-index"><span>{t.ourApproach}</span><span>01 / 03</span></div></div></section>
      <section className="admissions-section" id="admissions"><div className="admissions-pattern" /><div className="admissions-content"><div className="eyebrow light"><span className="eyebrow-dot" /> {t.next}</div><h2>{t.ready}<br />{t.something} <em>{t.ofIt}</em></h2><p>{t.nextDescription}</p><a className="button button-light" href="/apply" data-route>{t.applyNow} <Arrow diagonal /></a></div><div className="admissions-side"><span className="side-number">BTR</span><span>RWAMIKO<br />TECHNICAL<br />SECONDARY SCHOOL</span><i /></div></section>
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><span>BTR</span><i /></span><span className="brand-name">RWAMIKO <small>TECHNICAL SECONDARY SCHOOL</small></span></a><span className="footer-motto">{t.motto}</span><a className="back-top" href="#home">{t.backTop} <span>↑</span></a><div className="footer-bottom"><span>© BTR Rwamiko TSS</span><span>Rwamiko, Rwanda</span><span>{t.built}</span></div></footer>
  </div>;
}
