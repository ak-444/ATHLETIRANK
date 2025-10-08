import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetEmail = async (email, resetLink) => {
  try {
    await resend.emails.send({
      from: 'AthletiRank <onboarding@resend.dev>',
      to: email,
      subject: 'Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="color:#1a73e8;">Reset Password</a>
      `,
    });
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
};