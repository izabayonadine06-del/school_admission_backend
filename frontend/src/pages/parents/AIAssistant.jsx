import React from 'react';

export default function AIAssistant({ language = 'en' }) {
  const rw = language === 'rw';
  return (
    <section className="parent-panel ai-assistant-panel">
      <div className="ai-assistant-heading">
        <span className="ai-assistant-icon" aria-hidden="true">AI</span>
        <div><small>{rw ? 'UMUFASHA KU MAKURU Y’ISHURI' : 'SCHOOL INFORMATION ASSISTANT'}</small><h2>{rw ? 'Baza BTR Rwamiko' : 'Ask BTR Rwamiko'}</h2><p>{rw ? 'Bona ubufasha ku makuru y’ishuri mu Kinyarwanda cyangwa Icyongereza.' : 'Get help with school information in Kinyarwanda or English.'}</p></div>
      </div>
      <div className="ai-assistant-chat">
        <div className="ai-assistant-message"><span className="ai-message-mark">AI</span><p>{rw ? 'Muraho! Nzagufasha kumenya amakuru yerekeye kwiyandikisha, amafaranga y’ishuri, ingengabihe n’amategeko y’ishuri.' : 'Hello! I’ll help you find clear information about admissions, school fees, schedules, and school rules.'}</p></div>
        <div className="ai-assistant-status"><span className="ai-status-dot"/><div><b>{rw ? 'Umufasha aracyategurwa' : 'The assistant is being set up'}</b><p>{rw ? 'Azatanga ibisubizo ashingiye ku makuru yizewe y’ishuri serivisi ya AI n’ububiko bw’amakuru nibimara gutegurwa.' : 'It will answer using verified school information once the AI service and school knowledge base are connected.'}</p></div></div>
      </div>
      <form className="ai-question-form" onSubmit={(event) => event.preventDefault()}>
        <textarea disabled rows="2" aria-label={rw ? 'Baza ikibazo' : 'Ask a question'} placeholder={rw ? 'Baza ibijyanye no kwiyandikisha, amafaranga, ingengabihe…' : 'Ask about admissions, fees, schedules…'} />
        <button disabled aria-label={rw ? 'Ohereza ikibazo' : 'Send question'}>{rw ? 'Ohereza' : 'Send'}</button>
      </form>
      <p className="ai-language-note">{rw ? 'Indimi: Ikinyarwanda n’Icyongereza' : 'Languages: Kinyarwanda and English'}</p>
    </section>
  );
}
