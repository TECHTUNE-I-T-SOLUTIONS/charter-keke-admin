import { NextResponse } from "next/server"

/**
 * GET /api/admin/metrics
 * Fetch Supabase metrics from their Prometheus API
 */
export async function GET() {
  try {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0].split("//")[1] || ""
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!projectRef || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      )
    }

    // Fetch metrics from Supabase Prometheus API
    const metricsUrl = `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`

    const response = await fetch(metricsUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`service_role:${serviceRoleKey}`).toString("base64")}`,
      },
    })

    if (!response.ok) {
      console.error("Metrics API error:", response.statusText)
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      )
    }

    const metricsText = await response.text()

    // Parse Prometheus metrics format
    const metrics = parsePrometheusMetrics(metricsText)

    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

interface ParsedMetric {
  [key: string]: number | string
}

/**
 * Parse Prometheus metrics format into JSON
 */
function parsePrometheusMetrics(text: string): Record<string, ParsedMetric[]> {
  const metrics: Record<string, ParsedMetric[]> = {}
  const lines = text.split("\n")

  for (const line of lines) {
    // Skip comments and empty lines
    if (!line || line.startsWith("#")) continue

    // Parse metric line: metric_name{labels} value timestamp
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?([^}]*)\}?\s+([\d.eE+-]+)(?:\s+(\d+))?/)

    if (match) {
      const [, metricName, labelString, value] = match
      const labels = parseBraceLabels(labelString)

      if (!metrics[metricName]) {
        metrics[metricName] = []
      }

      metrics[metricName].push({
        ...labels,
        value: parseFloat(value),
      })
    }
  }

  return metrics
}

/**
 * Parse Prometheus label format: key1="value1",key2="value2"
 */
function parseBraceLabels(labelString: string): ParsedMetric {
  const labels: ParsedMetric = {}

  if (!labelString) return labels

  const labelMatches = labelString.matchAll(/([a-zA-Z_:][a-zA-Z0-9_:]*?)="([^"\\]*(\\.[^"\\]*)*)"/g)

  for (const match of labelMatches) {
    const [, key, value] = match
    // Unescape the value
    labels[key] = value.replace(/\\(.)/g, "$1")
  }

  return labels
}
