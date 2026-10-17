const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM || user;
  if (!user || !password || !from) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass: password }
    });
  }
  return { transporter, from };
}

async function sendParentEmail({ to, parentName = 'Parent', subject, message }) {
  const mail = getTransporter();
  if (!mail || !to) return false;
  await mail.transporter.sendMail({
    from: mail.from,
    to,
    subject,
    text: [`Dear ${parentName},`, '', message, '', 'BTR Rwamiko TSS'].join('\n')
  });
  return true;
}

async function sendDisciplineEmail({ parentName, parentEmail, studentName, schoolClass, message }) {
  return sendParentEmail({
    to: parentEmail,
    parentName,
    subject: `School discipline notice for ${studentName}`,
    message: `The school has sent a discipline notice regarding ${studentName}${schoolClass ? ` (${schoolClass})` : ''}:\n\n${message}`
  });
}

module.exports = { sendParentEmail, sendDisciplineEmail };
