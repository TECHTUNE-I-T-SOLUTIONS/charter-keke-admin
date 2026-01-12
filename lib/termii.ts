// Termii SMS/OTP Integration
// Note: API calls should be made from server-side only

interface TermiiSendSMSOptions {
  to: string
  message: string
  channel?: "generic" | "dnd" | "whatsapp"
  type?: "plain"
}

interface TermiiSendOTPOptions {
  to: string
  pinLength?: number
  pinType?: "NUMERIC" | "ALPHANUMERIC"
  pinTimeToLive?: number
  pinAttempts?: number
}

interface TermiiVerifyOTPOptions {
  pinId: string
  pin: string
}

const TERMII_BASE_URL = "https://api.ng.termii.com/api"

// Server-side function to send SMS
export async function sendSMS(options: TermiiSendSMSOptions) {
  const apiKey = process.env.TERMII_API_KEY
  const senderId = process.env.TERMII_SENDER_ID || "CHARTER KEKE"

  if (!apiKey) {
    throw new Error("Termii API key not configured")
  }

  const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: options.to,
      from: senderId,
      sms: options.message,
      type: options.type || "plain",
      channel: options.channel || "generic",
      api_key: apiKey,
    }),
  })

  return response.json()
}

// Server-side function to send OTP
export async function sendOTP(options: TermiiSendOTPOptions) {
  const apiKey = process.env.TERMII_API_KEY
  const senderId = process.env.TERMII_SENDER_ID || "CHARTER KEKE"

  if (!apiKey) {
    throw new Error("Termii API key not configured")
  }

  const response = await fetch(`${TERMII_BASE_URL}/sms/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      message_type: "NUMERIC",
      to: options.to,
      from: senderId,
      channel: "generic",
      pin_attempts: options.pinAttempts || 3,
      pin_time_to_live: options.pinTimeToLive || 10,
      pin_length: options.pinLength || 6,
      pin_placeholder: "< 1234 >",
      message_text: "Your Charter Keke verification code is < 1234 >. Valid for 10 minutes.",
      pin_type: options.pinType || "NUMERIC",
    }),
  })

  return response.json()
}

// Server-side function to verify OTP
export async function verifyOTP(options: TermiiVerifyOTPOptions) {
  const apiKey = process.env.TERMII_API_KEY

  if (!apiKey) {
    throw new Error("Termii API key not configured")
  }

  const response = await fetch(`${TERMII_BASE_URL}/sms/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      pin_id: options.pinId,
      pin: options.pin,
    }),
  })

  return response.json()
}
