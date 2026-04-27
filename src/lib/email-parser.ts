export function parseEmail(fromField: string): {
  senderEmail: string
  senderName: string | null
} {
  // Format: "John Doe <john@example.com>" or "john@example.com"
  const match = fromField.match(/(.*?)\s*<(.+?)>/)

  if (match) {
    return {
      senderName: match[1].trim().replace(/['"]/g, ""),
      senderEmail: match[2].trim().toLowerCase(),
    }
  }

  return {
    senderName: null,
    senderEmail: fromField.trim().toLowerCase(),
  }
}

export function extractDomain(email: string): string {
  const parts = email.split("@")
  return parts.length === 2 ? parts[1].toLowerCase() : ""
}
