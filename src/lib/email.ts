// lib/email.ts
export async function sendWelcomeEmail(email: string) {
    console.log("🚀 WELCOME EMAIL: Starting sendWelcomeEmail function", { 
      recipientEmail: email,
      timestamp: new Date().toISOString() 
    });

    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const sender = process.env.EMAIL_FROM || `welcome@${domain}`;
    const template = "Welcome email"; // Mailgun template name
  
    console.log("🔍 WELCOME EMAIL: Environment check", {
      hasApiKey: !!apiKey,
      hasDomain: !!domain,
      domain,
      sender,
      template,
      nodeEnv: process.env.NODE_ENV,
      availableMailgunVars: Object.keys(process.env).filter(key => key.includes('MAILGUN'))
    });
  
    if (!apiKey || !domain) {
      console.error("❌ WELCOME EMAIL: Missing Mailgun credentials", {
        MAILGUN_API_KEY: !!apiKey,
        MAILGUN_DOMAIN: !!domain,
        EMAIL_FROM: !!process.env.EMAIL_FROM,
        allEnvVars: Object.keys(process.env).filter(key => key.includes('MAIL')).join(', ')
      });
      return { success: false, error: "Missing credentials" };
    }
  
    const form = new URLSearchParams();
    form.append("from", sender);
    form.append("to", email);
    form.append("subject", "🎉 Welcome to Never Forget");
    form.append("template", template);
  
    // Optional: Add template variables (adjust keys as needed)
    form.append("h:X-Mailgun-Variables", JSON.stringify({}));

    console.log("📧 WELCOME EMAIL: Prepared form data", {
      from: sender,
      to: email,
      subject: "🎉 Welcome to Never Forget",
      template: template,
      formKeys: Array.from(form.keys())
    });
  
    const mailgunUrl = `https://api.eu.mailgun.net/v3/${domain}/messages`;
    console.log("🌍 WELCOME EMAIL: Making request to Mailgun", { 
      url: mailgunUrl,
      method: "POST" 
    });

    try {
      const response = await fetch(mailgunUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
  
      console.log("📬 WELCOME EMAIL: Mailgun response", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ WELCOME EMAIL: Failed to send email", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          recipientEmail: email
        });
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      } else {
        const successResponse = await response.text();
        console.log("✅ WELCOME EMAIL: Successfully sent", {
          recipientEmail: email,
          response: successResponse,
          timestamp: new Date().toISOString()
        });
        return { success: true, response: successResponse };
      }
    } catch (error) {
      console.error("💥 WELCOME EMAIL: Exception during send", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        recipientEmail: email
      });
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }