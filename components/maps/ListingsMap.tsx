"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

import {
  createListingMarkerIcon,
  isValidCoordinatePair,
} from "@/components/maps/leafletHelpers";

type ListingMapPoint = {
  id: string;
  title: string;
  city: string;
  address: string;
  pricePerMonth: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  listings: ListingMapPoint[];
};

const defaultCenter: [number, number] = [46.603354, 1.888334];

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(defaultCenter, 5);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds: LatLngBoundsExpression = points;
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);

  return null;
}

export default function ListingsMap({ listings }: Props) {
  const points = useMemo(
    () =>
      listings.filter((listing) => isValidCoordinatePair(listing.latitude, listing.longitude)),
    [listings],
  );

  const coordinates = useMemo(
    () =>
      points.map(
        (listing) =>
          [listing.latitude as number, listing.longitude as number] as [number, number],
      ),
    [points],
  );

  if (!points.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-[#EBEBE8] bg-surface-container-lowest px-6 text-center shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
        <div className="max-w-md space-y-2">
          <p className="font-h3 text-h3 text-primary">Map preview</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            No approved listings with coordinates are available yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EBEBE8] bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
      <MapContainer
        center={defaultCenter}
        className="h-[420px] w-full"
        scrollWheelZoom={false}
        zoom={5}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={coordinates} />
        {points.map((listing) => {
          const latitude = listing.latitude as number;
          const longitude = listing.longitude as number;

          return (
            <Marker
              icon={createListingMarkerIcon()}
              key={listing.id}
              position={[latitude, longitude]}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-primary">{listing.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {listing.city}
                    {listing.address ? ` · ${listing.address}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    €{listing.pricePerMonth} / month
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
