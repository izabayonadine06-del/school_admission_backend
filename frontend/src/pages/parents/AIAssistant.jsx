import React from 'react';

export default function AIAssistant() {
  return (
    <section className="parent-panel ai-assistant-panel">
      <div className="ai-assistant-heading">
        <span className="ai-assistant-icon" aria-hidden="true">AI</span>
        <div><small>SCHOOL INFORMATION ASSISTANT</small><h2>Ask BTR Rwamiko</h2><p>Get help with school information in Kinyarwanda or English.</p></div>
      </div>
      <div className="ai-assistant-chat">
        <div className="ai-assistant-message"><span className="ai-message-mark">AI</span><p>Muraho! I’ll help you find clear information about admissions, school fees, schedules, and school rules.</p></div>
        <div className="ai-assistant-status"><span className="ai-status-dot"/><div><b>The assistant is being set up</b><p>It will answer using verified school information once the AI service and school knowledge base are connected.</p></div></div>
      </div>
      <form className="ai-question-form" onSubmit={(event) => event.preventDefault()}>
        <textarea disabled rows="2" aria-label="Ask a question" placeholder="Ask about admissions, fees, schedules…" />
        <button disabled aria-label="Send question">Send</button>
      </form>
      <p className="ai-language-note">Planned languages: Kinyarwanda and English</p>
    </section>
  );
}
