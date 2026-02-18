// Termii SMS/OTP Integration (server-side only)

export interface TermiiSendSMSOptions {
  to: string
  message: string
  from?: string
  channel?: "generic" | "dnd" | "whatsapp" | "voice"
  type?: "plain" | "unicode" | "encrypted"
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

interface RideRequestSMSOptions {
  to: string
  rideId: string
  pickup: string
  destination: string
  fare: number
}

type JsonLike = Record<string, unknown>

const TERMII_BASE_URL = (process.env.TERMII_BASE_URL || "https://api.ng.termii.com").replace(/\/+$/, "")
const TERMII_API_URL = `${TERMII_BASE_URL}/api`

function getTermiiConfig() {
  const apiKey = process.env.TERMII_API_KEY
  const senderId = process.env.TERMII_SENDER_ID || "charterkeke"

  if (!apiKey) {
    throw new Error("Termii API key not configured")
  }

  return { apiKey, senderId }
}

export function toTermiiPhoneNumber(rawPhone: string): string | null {
  if (!rawPhone) return null

  const digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null

  if (digits.startsWith("2340") && digits.length === 14) {
    return `234${digits.slice(4)}`
  }

  if (digits.startsWith("234") && digits.length === 13) {
    return digits
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `234${digits.slice(1)}`
  }

  return null
}

async function postTermii(path: string, payload: JsonLike) {
  const response = await fetch(`${TERMII_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let responseBody: JsonLike | string = {}

  try {
    responseBody = responseText ? JSON.parse(responseText) : {}
  } catch {
    responseBody = responseText
  }

  if (!response.ok) {
    throw new Error(
      `Termii request failed (${response.status}): ${typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody)}`
    )
  }

  if (typeof responseBody === "object" && responseBody !== null) {
    const code = String((responseBody as any).code || "").toLowerCase()
    if (code && code !== "ok" && code !== "success") {
      throw new Error(`Termii non-success response: ${JSON.stringify(responseBody)}`)
    }
  }

  return responseBody
}

export async function sendSMS(options: TermiiSendSMSOptions) {
  const { apiKey, senderId } = getTermiiConfig()

  const normalizedPhone = toTermiiPhoneNumber(options.to)
  if (!normalizedPhone) {
    throw new Error(`Invalid destination phone number: ${options.to}`)
  }

  return postTermii("/sms/send", {
    to: normalizedPhone,
    from: options.from || senderId,
    sms: options.message,
    type: options.type || "plain",
    channel: options.channel || "generic",
    api_key: apiKey,
  })
}

export async function sendRideRequestSMS(options: RideRequestSMSOptions) {
  const shortRideRef = options.rideId.slice(0, 8).toUpperCase()
  const message = `New ride CK-${shortRideRef}: ${options.pickup} -> ${options.destination}. Fare: N${Math.round(
    options.fare || 0
  )}. Reply ACCEPT ${options.rideId} to take this trip.`

  const fallbackToGeneric = process.env.TERMII_SMS_FALLBACK_TO_GENERIC !== "false"

  try {
    return await sendSMS({
      to: options.to,
      message,
      channel: "dnd",
      type: "plain",
    })
  } catch (error) {
    console.error("[Termii] DND SMS failed, considering generic fallback:", error)
    if (!fallbackToGeneric) {
      throw error
    }

    return sendSMS({
      to: options.to,
      message,
      channel: "generic",
      type: "plain",
    })
  }
}

export async function sendOTP(options: TermiiSendOTPOptions) {
  const { apiKey, senderId } = getTermiiConfig()

  const normalizedPhone = toTermiiPhoneNumber(options.to)
  if (!normalizedPhone) {
    throw new Error(`Invalid OTP destination phone number: ${options.to}`)
  }

  return postTermii("/sms/otp/send", {
    api_key: apiKey,
    message_type: "NUMERIC",
    to: normalizedPhone,
    from: senderId,
    channel: "generic",
    pin_attempts: options.pinAttempts || 3,
    pin_time_to_live: options.pinTimeToLive || 10,
    pin_length: options.pinLength || 6,
    pin_placeholder: "< 1234 >",
    message_text: "Your Charter Keke verification code is < 1234 >. Valid for 10 minutes.",
    pin_type: options.pinType || "NUMERIC",
  })
}

export async function verifyOTP(options: TermiiVerifyOTPOptions) {
  const { apiKey } = getTermiiConfig()

  return postTermii("/sms/otp/verify", {
    api_key: apiKey,
    pin_id: options.pinId,
    pin: options.pin,
  })
}
