"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import {
  createListingMarkerIcon,
  isValidCoordinatePair,
  toLatLng,
} from "@/components/maps/leafletHelpers";

type Props = {
  latitude: string;
  longitude: string;
};

function parseCoordinate(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function LocationPreviewMap({ latitude, longitude }: Props) {
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  const hasValidCoordinates = isValidCoordinatePair(parsedLatitude, parsedLongitude);

  if (!hasValidCoordinates) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container px-6 text-center">
        <div className="max-w-xs space-y-2">
          <p className="font-h3 text-h3 text-primary">Location preview</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Enter both latitude and longitude to preview the map.
          </p>
        </div>
      </div>
    );
  }

  const safeLatitude = parsedLatitude as number;
  const safeLongitude = parsedLongitude as number;
  const position = toLatLng(safeLatitude, safeLongitude);

  return (
    <div className="h-full min-h-[200px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container">
      <MapContainer
        center={position}
        className="h-full min-h-[200px] w-full"
        scrollWheelZoom={false}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker icon={createListingMarkerIcon()} position={position}>
          <Popup>Selected location preview</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
