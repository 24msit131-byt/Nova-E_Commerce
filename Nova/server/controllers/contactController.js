import nodemailer from 'nodemailer';

const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
        : undefined
    });
  }

  return null;
};

export const sendContactEmail = async (req, res) => {
  try {
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    const senderName = String(req.user?.fullName || req.body?.name || '').trim();
    const senderEmail = String(req.user?.email || req.body?.email || '').trim().toLowerCase();

    if (!subject || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Subject and message are required.'
      });
    }

    if (!senderEmail) {
      return res.status(400).json({
        status: 'fail',
        message: 'Sender email is required.'
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({
        status: 'fail',
        message: 'Email service is not configured on the server.'
      });
    }

    const appName = process.env.APP_NAME || 'Nova';
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nova.local';
    const recipientEmail = process.env.CONTACT_RECIPIENT || 'rahulkprajapati1@gmail.com';

    const text = `New contact form submission from Nova\n\nName: ${senderName || 'User'}\nEmail: ${senderEmail}\nSubject: ${subject}\n\nMessage:\n${message}\n`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #2f2a24; line-height: 1.6;">
        <h2 style="margin-bottom: 16px;">${appName} Contact Request</h2>
        <p><strong>Name:</strong> ${senderName || 'User'}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #e6dfd2; margin: 20px 0;" />
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `${appName} Contact Form <${fromAddress}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `[${appName} Contact] ${subject}`,
      text,
      html
    });

    res.status(200).json({
      status: 'success',
      message: 'Your message has been sent successfully.'
    });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({
      status: 'fail',
      message: err.message || 'Failed to send your message.'
    });
  }
};