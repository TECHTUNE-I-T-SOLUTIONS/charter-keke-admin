import { NextRequest, NextResponse } from "next/server";

const googlePlacesError = async (response: Response) => {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.error?.status || text;
  } catch {
    return text;
  }
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const placeId = String(body?.placeId || "").trim();
    const sessionToken = String(body?.sessionToken || "").trim();

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    if (sessionToken) {
      url.searchParams.set("sessionToken", sessionToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
      },
    });

    if (!response.ok) {
      const details = await googlePlacesError(response);
      console.error("[Place Details] Google request failed:", response.status, details);
      return NextResponse.json({ error: "Google Place Details failed", details }, { status: response.status });
    }

    const place = await response.json();
    return NextResponse.json({ place });
  } catch (error: any) {
    console.error("[Place Details] Unexpected error:", error);
    return NextResponse.json(
      { error: "Google Place Details failed", details: error?.message },
      { status: 500 }
    );
  }
}
