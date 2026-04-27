import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseEmail } from "@/lib/email-parser"
import { matchEmailToDeal } from "@/lib/email-matcher"

// No auth required - this is a webhook from Sendgrid
export async function POST(req: NextRequest) {
  try {
    // Sendgrid sends multipart/form-data
    const formData = await req.formData()
    const from = formData.get("from") as string
    const to = formData.get("to") as string
    const subject = formData.get("subject") as string
    const text = formData.get("text") as string // plain text body
    const html = formData.get("html") as string | null // HTML body
    const headers = formData.get("headers") as string | null

    // Parse email to extract clean sender
    const { senderEmail, senderName } = parseEmail(from)

    // Try to match to a deal
    const matchedDeal = await matchEmailToDeal(senderEmail, subject, text)

    if (matchedDeal) {
      // Auto-match: Create activity directly
      const emailContent = formatEmailContent({
        from: senderName || senderEmail,
        subject,
        body: text,
        receivedAt: new Date(),
      })

      await prisma.activity.create({
        data: {
          dealId: matchedDeal.id,
          type: "email",
          content: emailContent,
          userId: matchedDeal.ownerId, // Assign to deal owner
          occurredAt: new Date(),
        },
      })

      // Also log for history
      await prisma.emailLog.create({
        data: {
          from: senderEmail,
          to,
          subject,
          body: text,
          bodyHtml: html,
          status: "matched",
          matchedDealId: matchedDeal.id,
          rawHeaders: headers,
        },
      })
    } else {
      // No match: Save as pending
      await prisma.emailLog.create({
        data: {
          from: senderEmail,
          to,
          subject,
          body: text,
          bodyHtml: html,
          status: "pending",
          rawHeaders: headers,
        },
      })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Inbound email error:", error)
    return NextResponse.json({ error: "Failed to process email" }, { status: 500 })
  }
}

function formatEmailContent(email: {
  from: string
  subject: string
  body: string
  receivedAt: Date
}) {
  return `Ämne: ${email.subject}
Från: ${email.from}
Mottaget: ${email.receivedAt.toLocaleString("sv-SE")}

${email.body}`
}
