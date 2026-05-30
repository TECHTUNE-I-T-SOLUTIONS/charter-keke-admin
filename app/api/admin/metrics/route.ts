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
    const summary = summarizeMetrics(metrics)

    return NextResponse.json({
      metrics,
      summary,
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

const metricValue = (metrics: Record<string, ParsedMetric[]>, key: string, predicate?: (row: ParsedMetric) => boolean) => {
  const rows = metrics[key] || []
  const row = predicate ? rows.find(predicate) : rows[0]
  const value = Number(row?.value ?? 0)
  return Number.isFinite(value) ? value : 0
}

const metricSum = (metrics: Record<string, ParsedMetric[]>, key: string, predicate?: (row: ParsedMetric) => boolean) =>
  (metrics[key] || []).reduce((sum, row) => {
    if (predicate && !predicate(row)) return sum
    const value = Number(row.value || 0)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

const percent = (used: number, total: number) => {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)))
}

const bytesToGb = (bytes: number) => Math.round((bytes / 1024 / 1024 / 1024) * 100) / 100

function summarizeMetrics(metrics: Record<string, ParsedMetric[]>) {
  const memTotal = metricValue(metrics, "node_memory_MemTotal_bytes")
  const memFree = metricValue(metrics, "node_memory_MemFree_bytes")
  const memAvailable = metricValue(metrics, "node_memory_MemAvailable_bytes") || memFree
  const memUsed = Math.max(0, memTotal - memAvailable)

  const diskSize = metricSum(metrics, "node_filesystem_size_bytes", (row) => String(row.fstype || "") !== "tmpfs")
  const diskFree = metricSum(metrics, "node_filesystem_free_bytes", (row) => String(row.fstype || "") !== "tmpfs")
  const diskUsed = Math.max(0, diskSize - diskFree)

  const cpuCores = metricSum(metrics, "node_cpu_online")
  const load1 = metricValue(metrics, "node_load1")
  const load5 = metricValue(metrics, "node_load5")
  const load15 = metricValue(metrics, "node_load15")
  const cpuUsage = cpuCores > 0 ? percent(load1, cpuCores) : Math.round(load1 * 100)

  const pgbouncerUp = metricValue(metrics, "pgbouncer_up")
  const gotrueRunning = metricValue(metrics, "gotrue_running")
  const usedConnections = metricSum(metrics, "pgbouncer_pools_server_used_connections")
  const waitingConnections = metricSum(metrics, "pgbouncer_pools_client_waiting_connections")
  const maxDbConnections = metricValue(metrics, "db_sql_connection_max_open") || 0
  const queryCount = metricSum(metrics, "pgbouncer_stats_queries_pooled_total")
  const queryDuration = metricSum(metrics, "pgbouncer_stats_queries_duration_seconds_total")
  const avgQueryMs = queryCount > 0 ? Math.round((queryDuration / queryCount) * 1000) : 0

  const httpCount = metricSum(metrics, "http_server_request_duration_seconds_count")
  const httpDuration = metricSum(metrics, "http_server_request_duration_seconds_sum")
  const avgHttpMs = httpCount > 0 ? Math.round((httpDuration / httpCount) * 1000) : 0
  const httpErrors = metricSum(metrics, "http_server_request_duration_seconds_count", (row) =>
    Number(row.http_response_status_code || 0) >= 400
  )
  const errorRate = httpCount > 0 ? Math.round((httpErrors / httpCount) * 10000) / 100 : 0

  const rxBytes = metricSum(metrics, "node_network_receive_bytes_total")
  const txBytes = metricSum(metrics, "node_network_transmit_bytes_total")
  const rxErrors = metricSum(metrics, "node_network_receive_errs_total")
  const txErrors = metricSum(metrics, "node_network_transmit_errs_total")
  const rxDrops = metricSum(metrics, "node_network_receive_drop_total")
  const txDrops = metricSum(metrics, "node_network_transmit_drop_total")

  const services = [
    {
      name: "Database Pooler",
      key: "pgbouncer",
      status: pgbouncerUp >= 1 ? "online" : "offline",
      detail: pgbouncerUp >= 1 ? "PgBouncer accepting metrics" : "PgBouncer not reporting healthy",
      value: pgbouncerUp,
    },
    {
      name: "Auth Service",
      key: "gotrue",
      status: gotrueRunning >= 1 ? "online" : "offline",
      detail: gotrueRunning >= 1 ? "GoTrue auth service running" : "GoTrue not reporting healthy",
      value: gotrueRunning,
    },
    {
      name: "Collectors",
      key: "collectors",
      status: metricSum(metrics, "node_scrape_collector_success", (row) => Number(row.value) < 1) > 0 ? "warning" : "online",
      detail: `${metricSum(metrics, "node_scrape_collector_success")} collectors reporting`,
      value: metricSum(metrics, "node_scrape_collector_success"),
    },
  ]

  const resources = [
    { label: "CPU Load", value: cpuUsage, max: 100, unit: "%", status: cpuUsage > 80 ? "warning" : "good", detail: `${load1.toFixed(2)} / ${cpuCores || "?"} cores` },
    { label: "Memory Usage", value: percent(memUsed, memTotal), max: 100, unit: "%", status: percent(memUsed, memTotal) > 85 ? "warning" : "good", detail: `${bytesToGb(memUsed)}GB / ${bytesToGb(memTotal)}GB` },
    { label: "Disk Usage", value: percent(diskUsed, diskSize), max: 100, unit: "%", status: percent(diskUsed, diskSize) > 85 ? "warning" : "good", detail: `${bytesToGb(diskUsed)}GB / ${bytesToGb(diskSize)}GB` },
    { label: "Connection Pool", value: usedConnections + waitingConnections, max: maxDbConnections || 100, unit: "conn", status: waitingConnections > 0 ? "warning" : "good", detail: `${usedConnections} used, ${waitingConnections} waiting` },
  ]

  const performance = [
    { label: "Avg Query Latency", value: `${avgQueryMs}ms`, numeric: avgQueryMs, status: avgQueryMs > 500 ? "warning" : "good" },
    { label: "Pooled Queries", value: queryCount.toLocaleString(), numeric: queryCount, status: "good" },
    { label: "Avg HTTP Latency", value: `${avgHttpMs}ms`, numeric: avgHttpMs, status: avgHttpMs > 1000 ? "warning" : "good" },
    { label: "HTTP Error Rate", value: `${errorRate}%`, numeric: errorRate, status: errorRate > 1 ? "warning" : "good" },
  ]

  const activity = [
    { type: pgbouncerUp >= 1 ? "success" : "warning", message: `Database pooler is ${pgbouncerUp >= 1 ? "online" : "offline"}`, time: "Live metric" },
    { type: gotrueRunning >= 1 ? "success" : "warning", message: `Auth service is ${gotrueRunning >= 1 ? "running" : "not healthy"}`, time: "Live metric" },
    { type: waitingConnections > 0 ? "warning" : "success", message: `${waitingConnections} client connections waiting`, time: "Connection pool" },
    { type: errorRate > 1 ? "warning" : "success", message: `${errorRate}% HTTP error rate`, time: "Auth/API telemetry" },
  ]

  return {
    projectRef: metrics.target_info?.[0]?.supabase_project_ref || metrics.pgbouncer_up?.[0]?.supabase_project_ref || null,
    databaseStatus: pgbouncerUp >= 1 ? "Connected" : "Offline",
    apiHealth: Math.max(0, Math.round((100 - errorRate) * 100) / 100),
    avgResponseMs: avgHttpMs || avgQueryMs,
    connections: {
      used: usedConnections,
      waiting: waitingConnections,
      max: maxDbConnections || null,
    },
    load: { load1, load5, load15, cpuCores },
    memory: { totalBytes: memTotal, usedBytes: memUsed, availableBytes: memAvailable, usagePercent: percent(memUsed, memTotal) },
    disk: { totalBytes: diskSize, usedBytes: diskUsed, freeBytes: diskFree, usagePercent: percent(diskUsed, diskSize) },
    network: {
      receiveBytes: rxBytes,
      transmitBytes: txBytes,
      receiveErrors: rxErrors,
      transmitErrors: txErrors,
      receiveDrops: rxDrops,
      transmitDrops: txDrops,
    },
    services,
    resources,
    performance,
    activity,
  }
}
