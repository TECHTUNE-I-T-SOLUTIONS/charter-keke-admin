"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, BadgeDollarSign, BarChart3, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

type DistanceBand = { maxKm: number | null; rate: number }

type PricingPayload = {
  setting: any
  bands: any[]
  metrics: any[]
  audit: any[]
}

const fallbackBands: DistanceBand[] = [
  { maxKm: 3, rate: 500 },
  { maxKm: 10, rate: 600 },
  { maxKm: null, rate: 700 },
]

function money(value: unknown) {
  return `₦${Number(value || 0).toLocaleString()}`
}

export function AdminPricingConsole() {
  const [data, setData] = useState<PricingPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    baseFare: 800,
    minimumFare: 1500,
    perMinute: 15,
    platformFeeRate: 0.15,
    etaLow: 4,
    etaNormal: 6,
    etaHeavy: 8,
    learningWeight: 0.1,
    notes: "",
    distanceBands: fallbackBands,
  })

  async function load() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/pricing", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Could not load pricing")
      setData(payload)
      if (payload.setting) {
        setForm({
          baseFare: Number(payload.setting.base_fare || 800),
          minimumFare: Number(payload.setting.minimum_fare || 1500),
          perMinute: Number(payload.setting.per_minute || 15),
          platformFeeRate: Number(payload.setting.platform_fee_rate ?? 0.15),
          etaLow: Number(payload.setting.eta_low_traffic_min_per_km || 4),
          etaNormal: Number(payload.setting.eta_normal_traffic_min_per_km || 6),
          etaHeavy: Number(payload.setting.eta_heavy_traffic_min_per_km || 8),
          learningWeight: Number(payload.setting.learning_weight ?? 0.1),
          notes: payload.setting.notes || "",
          distanceBands: (payload.bands || []).map((band: any) => ({
            maxKm: band.max_km === null ? null : Number(band.max_km),
            rate: Number(band.rate),
          })) || fallbackBands,
        })
      }
    } catch (error: any) {
      setMessage(error?.message || "Could not load pricing")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sampleFare = useMemo(() => {
    const distanceKm = 6
    const durationMin = Math.ceil(distanceKm * form.etaNormal)
    const band = [...form.distanceBands].sort((a, b) => (a.maxKm ?? 999999) - (b.maxKm ?? 999999)).find((item) => item.maxKm === null || distanceKm <= item.maxKm)
    const fare = Math.max(form.minimumFare, Math.round(form.baseFare + distanceKm * Number(band?.rate || 0) + durationMin * form.perMinute))
    return { distanceKm, durationMin, fare }
  }, [form])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseFare: form.baseFare,
          minimumFare: form.minimumFare,
          perMinute: form.perMinute,
          platformFeeRate: form.platformFeeRate,
          learningWeight: form.learningWeight,
          notes: form.notes,
          etaPerKm: {
            lowTraffic: form.etaLow,
            normalTraffic: form.etaNormal,
            heavyTraffic: form.etaHeavy,
          },
          distanceBands: form.distanceBands,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Could not save pricing")
      setData(payload)
      setMessage("Pricing updated. New bookings will use the latest RAIL model.")
    } catch (error: any) {
      setMessage(error?.message || "Could not save pricing")
    } finally {
      setSaving(false)
    }
  }

  function setBand(index: number, patch: Partial<DistanceBand>) {
    setForm((current) => ({
      ...current,
      distanceBands: current.distanceBands.map((band, bandIndex) => (bandIndex === index ? { ...band, ...patch } : band)),
    }))
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-4 py-6 text-[#24150f] md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#c96b1c]">Operations</p>
            <h1 className="font-serif text-4xl font-bold text-[#9f3b12]">RAIL Pricing Console</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#6b5a50]">
              Manage deterministic Charter Keke fare controls. Route analytics are system-learned and read-only.
            </p>
          </div>
          <Button onClick={save} disabled={saving || loading} className="bg-[#ff8a00] text-black hover:bg-[#f59e0b]">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save pricing"}
          </Button>
        </header>

        {message ? <div className="rounded-lg border border-[#f5c78b] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#8a3a0b]">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <BadgeDollarSign className="mb-3 h-6 w-6 text-[#ff8a00]" />
            <p className="text-sm text-[#6b5a50]">Sample Surulere to Yaba</p>
            <p className="mt-2 text-3xl font-black">{money(sampleFare.fare)}</p>
            <p className="text-xs text-[#8b7468]">{sampleFare.distanceKm}km · {sampleFare.durationMin} mins normal traffic</p>
          </div>
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <Activity className="mb-3 h-6 w-6 text-[#00a896]" />
            <p className="text-sm text-[#6b5a50]">Learned routes</p>
            <p className="mt-2 text-3xl font-black">{data?.metrics?.length || 0}</p>
            <p className="text-xs text-[#8b7468]">Read-only route performance records</p>
          </div>
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <BarChart3 className="mb-3 h-6 w-6 text-[#2563eb]" />
            <p className="text-sm text-[#6b5a50]">Driver platform fee</p>
            <p className="mt-2 text-3xl font-black">{Math.round(form.platformFeeRate * 100)}%</p>
            <p className="text-xs text-[#8b7468]">Deducted from each completed ride</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Fare Controls</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Base fare", "baseFare"],
                ["Minimum fare", "minimumFare"],
                ["Per minute", "perMinute"],
                ["Platform fee rate", "platformFeeRate"],
                ["Low traffic min/km", "etaLow"],
                ["Normal traffic min/km", "etaNormal"],
                ["Heavy traffic min/km", "etaHeavy"],
                ["Learning weight", "learningWeight"],
              ].map(([label, key]) => (
                <label key={key} className="text-sm font-semibold text-[#4a382e]">
                  {label}
                  <input
                    className="mt-1 w-full rounded-md border border-[#ead7c8] px-3 py-2 text-sm outline-none focus:border-[#ff8a00]"
                    type="number"
                    step={key === "platformFeeRate" || key === "learningWeight" ? "0.01" : "1"}
                    value={(form as any)[key]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold text-[#4a382e]">
              Notes
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-[#ead7c8] px-3 py-2 text-sm outline-none focus:border-[#ff8a00]"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>

          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Distance Bands</h2>
            <div className="mt-4 space-y-3">
              {form.distanceBands.map((band, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr] gap-3 rounded-md border border-[#f3e1d2] p-3">
                  <label className="text-sm font-semibold text-[#4a382e]">
                    Max KM
                    <input
                      className="mt-1 w-full rounded-md border border-[#ead7c8] px-3 py-2 text-sm outline-none focus:border-[#ff8a00]"
                      value={band.maxKm ?? "Infinity"}
                      onChange={(event) => setBand(index, { maxKm: event.target.value.toLowerCase().includes("inf") ? null : Number(event.target.value) })}
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#4a382e]">
                    Rate
                    <input
                      className="mt-1 w-full rounded-md border border-[#ead7c8] px-3 py-2 text-sm outline-none focus:border-[#ff8a00]"
                      type="number"
                      value={band.rate}
                      onChange={(event) => setBand(index, { rate: Number(event.target.value) })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Route Learning Analytics</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-[#8b7468]">
                <tr>
                  <th className="py-2">Route</th>
                  <th className="py-2">Rides</th>
                  <th className="py-2">Avg min/km</th>
                  <th className="py-2">Morning</th>
                  <th className="py-2">Afternoon</th>
                  <th className="py-2">Evening</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(data?.metrics || []).map((metric: any) => (
                  <tr key={metric.id} className="border-t border-[#f4e6da]">
                    <td className="py-3 font-semibold">{metric.route_key}</td>
                    <td>{metric.ride_count}</td>
                    <td>{Number(metric.avg_minutes_per_km || 0).toFixed(1)}</td>
                    <td>{metric.morning_avg ? Number(metric.morning_avg).toFixed(1) : "N/A"}</td>
                    <td>{metric.afternoon_avg ? Number(metric.afternoon_avg).toFixed(1) : "N/A"}</td>
                    <td>{metric.evening_avg ? Number(metric.evening_avg).toFixed(1) : "N/A"}</td>
                    <td>{metric.updated_at ? new Date(metric.updated_at).toLocaleString() : "N/A"}</td>
                  </tr>
                ))}
                {!loading && !data?.metrics?.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8b7468]">Route learning starts after completed rides record actual trip duration.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
