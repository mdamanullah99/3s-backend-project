import nodemailer from "nodemailer";

export default async function sendEmail(to, subject, message, isHtml = false) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Rinaz" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    [isHtml ? "html" : "text"]: message, // choose html or text dynamically
  };

  await transporter.sendMail(mailOptions);
}
