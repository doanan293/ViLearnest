interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function shouldLogEmailLocally(to: string) {
  return !process.env.RESEND_API_KEY || to.trim().toLowerCase().endsWith("@example.com");
}

export async function sendEmail(options: SendEmailOptions) {
  if (shouldLogEmailLocally(options.to)) {
    console.log("\n📬 [DEVELOPMENT EMAIL] ==========================");
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Link:    ${options.text}`);
    console.log("=================================================\n");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send email via Resend API:", errorText);
    }
  } catch (error) {
    console.error("Error sending email via Resend API:", error);
  }
}
