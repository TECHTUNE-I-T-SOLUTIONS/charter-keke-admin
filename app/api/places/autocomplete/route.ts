import { NextRequest, NextResponse } from "next/server";

const LAGOS_CENTER = { latitude: 6.5244, longitude: 3.3792 };
const LAGOS_RADIUS_METERS = 50000;

const googlePlacesError = async (response: Response) => {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.error?.status || text;
  } catch {
    return text;
  }
};

const searchTextFallback = async (input: string, apiKey: string) => {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({
      textQuery: `${input} Lagos Nigeria`,
      languageCode: "en",
      regionCode: "NG",
      pageSize: 5,
      locationBias: {
        circle: {
          center: LAGOS_CENTER,
          radius: LAGOS_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await googlePlacesError(response);
    console.error("[Places Text Search Fallback] Google request failed:", response.status, details);
    return NextResponse.json(
      { error: "Google Places search failed", details },
      { status: response.status }
    );
  }

  const payload = await response.json();
  const suggestions = (payload?.places || [])
    .map((place: any) => {
      const name = place?.displayName?.text || place?.formattedAddress;
      if (!place?.id || !name) return null;

      const secondaryText =
        place?.formattedAddress && place.formattedAddress !== name ? place.formattedAddress : "Lagos, Nigeria";

      return {
        placePrediction: {
          place: `places/${place.id}`,
          placeId: place.id,
          text: {
            text: place?.formattedAddress || name,
          },
          structuredFormat: {
            mainText: {
              text: name,
            },
            secondaryText: {
              text: secondaryText,
            },
          },
          location: place?.location || null,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ suggestions, source: "textSearchFallback" });
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const input = String(body?.input || "").trim();
    const sessionToken = String(body?.sessionToken || "").trim();

    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input,
        languageCode: "en",
        regionCode: "NG",
        sessionToken,
        includedRegionCodes: ["ng"],
        locationBias: {
          circle: {
            center: LAGOS_CENTER,
            radius: LAGOS_RADIUS_METERS,
          },
        },
      }),
    });

    if (!response.ok) {
      const details = await googlePlacesError(response);
      console.error("[Places Autocomplete] Google request failed:", response.status, details);
      if (
        response.status === 403 &&
        typeof details === "string" &&
        details.includes("AutocompletePlaces")
      ) {
        return searchTextFallback(input, apiKey);
      }
      return NextResponse.json(
        { error: "Google Places autocomplete failed", details },
        { status: response.status }
      );
    }

    const payload = await response.json();
    return NextResponse.json({ suggestions: payload?.suggestions || [] });
  } catch (error: any) {
    console.error("[Places Autocomplete] Unexpected error:", error);
    return NextResponse.json(
      { error: "Google Places autocomplete failed", details: error?.message },
      { status: 500 }
    );
  }
}
