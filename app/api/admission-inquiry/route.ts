import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const admissionsInbox = process.env.ADMISSIONS_INBOX_EMAIL;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not set; admission inquiry emails will not be sent.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentName, email, grade, message } = body;

    if (!studentName || !email || !grade || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();

    const { error: dbError } = await supabaseAdmin.from("admission_inquiries").insert({
      student_name: studentName,
      parent_email: email,
      grade,
      message,
      created_at: createdAt,
    });

    if (dbError) {
      console.error("Error saving admission inquiry", dbError);
      return NextResponse.json({ error: "Failed to save inquiry" }, { status: 500 });
    }

    if (resend && admissionsInbox) {
      try {
        console.log("Sending admission inquiry email via Resend to", admissionsInbox, "and parent", email);

        const textBody = `Student: ${studentName}\nParent email: ${email}\nGrade: ${grade}\nMessage: ${message}`;

        const htmlBody = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0f172a; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.15);">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #e0e7ff; padding: 16px 20px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; opacity: 0.85; margin-bottom: 4px;">Admission inquiry</div>
                <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #eef2ff;">New prospective student</h1>
              </div>

              <div style="padding: 18px 20px 8px 20px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0 0 12px 0; color: #4b5563;">A new admission inquiry has been submitted from your website.</p>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                  <tbody>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; font-size: 12px; color: #6b7280; width: 32%;">Student name</td>
                      <td style="padding: 6px 0; font-size: 13px; color: #111827;">${studentName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; font-size: 12px; color: #6b7280;">Parent email</td>
                      <td style="padding: 6px 0; font-size: 13px;"><a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; font-size: 12px; color: #6b7280;">Requested grade</td>
                      <td style="padding: 6px 0; font-size: 13px; color: #111827;">${grade}</td>
                    </tr>
                  </tbody>
                </table>

                <div style="margin-top: 8px;">
                  <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">Message</div>
                  <div style="font-size: 13px; color: #111827; line-height: 1.5; white-space: pre-wrap; background-color: #f9fafb; border-radius: 8px; padding: 10px 12px; border: 1px solid #e5e7eb;">${message}</div>
                </div>
              </div>

              <div style="padding: 10px 20px 14px 20px; font-size: 11px; color: #9ca3af; background-color: #f9fafb;">
                <p style="margin: 0;">You are receiving this email because someone submitted the admission interest form on your school website.</p>
              </div>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "Admission Inquiries <onboarding@resend.dev>",
          to: [admissionsInbox, email],
          subject: "New admission inquiry",
          text: textBody,
          html: htmlBody,
        });

        console.log("Admission inquiry email sent to school and parent");
      } catch (emailError) {
        console.error("Error sending admission inquiry email", emailError);
      }
    } else {
      console.warn("Resend client or admissions inbox not configured; skipping email send.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in admission-inquiry API", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
