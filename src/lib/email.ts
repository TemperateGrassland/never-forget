// lib/email.ts
export async function sendWelcomeEmail(email: string) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const sender = process.env.EMAIL_FROM || `welcome@${domain}`;
    const template = "Welcome email"; // Mailgun template name
  
    if (!apiKey || !domain) {
      console.error("Missing Mailgun credentials");
      return;
    }
  
    const form = new URLSearchParams();
    form.append("from", sender);
    form.append("to", email);
    form.append("subject", "🎉 Welcome to Never Forget");
    form.append("template", template);
  
    // Optional: Add template variables (adjust keys as needed)
    form.append("h:X-Mailgun-Variables", JSON.stringify({}));
  
    try {
      const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
  
      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        console.error("Failed to send email:", status, errorText);
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }