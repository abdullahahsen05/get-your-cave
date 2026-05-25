import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  postcode?: string;
  country?: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

function pickCity(address?: NominatimAddress) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.county ??
    address?.state ??
    address?.country ??
    null
  );
}

function pickAddressLabel(result: NominatimSearchResult) {
  return result.display_name.trim();
}

async function fetchNominatimJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GETYOURCAVE/1.0 (local demo)",
      Referer: "http://localhost:3000",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}.`);
  }

  return response.json() as Promise<unknown>;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const latitude = url.searchParams.get("lat")?.trim() ?? "";
  const longitude = url.searchParams.get("lon")?.trim() ?? "";

  if (!query && (!latitude || !longitude)) {
    return NextResponse.json(
      { error: "Provide either q or lat/lon." },
      { status: 400 },
    );
  }

  try {
    if (query) {
      const payload = await fetchNominatimJson(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      );

      const results = Array.isArray(payload) ? (payload as NominatimSearchResult[]) : [];
      const result = results[0];

      if (!result) {
        return NextResponse.json(
          { error: "No matching location found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        displayName: pickAddressLabel(result),
        address: pickAddressLabel(result),
        city: pickCity(result.address),
      });
    }

    const payload = await fetchNominatimJson(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    );

    const result = payload as NominatimSearchResult & { error?: string };

    if (!result || typeof result !== "object" || "error" in result) {
      return NextResponse.json(
        { error: "No matching location found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: pickAddressLabel(result),
      address: pickAddressLabel(result),
      city: pickCity(result.address),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to look up that location right now.";

    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }
}
