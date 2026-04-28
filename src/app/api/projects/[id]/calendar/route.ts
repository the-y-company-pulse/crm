import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { date: "asc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Generate iCalendar (.ics) file
    const ics = generateICS(project)

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(project.name)}.ics"`,
      },
    })
  } catch (error) {
    console.error("Calendar export error:", error)
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 })
  }
}

function generateICS(project: any): string {
  const now = new Date()
  const timestamp = formatICSDate(now)

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Y CRM//Calendar Export//SV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + escapeICS(project.name),
    "X-WR-TIMEZONE:Europe/Stockholm",
  ]

  // Add each session as a separate event
  project.sessions.forEach((session: any) => {
    const eventStart = combineDateAndTime(session.date, session.startTime)
    const eventEnd = combineDateAndTime(session.date, session.endTime)
    const uid = `${session.id}@crm.ycompany.se`

    ics.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDate(eventStart)}`,
      `DTEND:${formatICSDate(eventEnd)}`,
      `SUMMARY:${escapeICS(project.name)}`,
      `DESCRIPTION:${escapeICS(project.format || "")}`,
      `LOCATION:${escapeICS(project.location || "")}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT"
    )
  })

  ics.push("END:VCALENDAR")

  return ics.join("\r\n")
}

function formatICSDate(date: Date): string {
  // Format: 20261016T083000 (YYYYMMDDTHHMMSS in local time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

function combineDateAndTime(date: string | Date, time: string): Date {
  const d = new Date(date)
  const [hours, minutes] = time.split(":").map(Number)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
}
