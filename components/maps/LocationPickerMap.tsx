"use client";

import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import {
  createListingMarkerIcon,
  isValidCoordinatePair,
  toLatLng,
} from "@/components/maps/leafletHelpers";

type Props = {
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 13;

function parseCoordinate(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function MapSelectionController({
  hasSelection,
  position,
  onLatitudeChange,
  onLongitudeChange,
}: Pick<Props, "onLatitudeChange" | "onLongitudeChange"> & {
  hasSelection: boolean;
  position: [number, number];
}) {
  const map = useMapEvents({
    click(event) {
      onLatitudeChange(event.latlng.lat.toFixed(6));
      onLongitudeChange(event.latlng.lng.toFixed(6));
    },
  });

  useEffect(() => {
    map.setView(position, hasSelection ? SELECTED_ZOOM : DEFAULT_ZOOM);
  }, [hasSelection, map, position]);

  return null;
}

function SelectedLocationMarker({
  latitude,
  longitude,
  address,
  city,
  onLatitudeChange,
  onLongitudeChange,
}: Props) {
  const { t } = useTranslation();
  const map = useMap();
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  const hasSelection = isValidCoordinatePair(parsedLatitude, parsedLongitude);
  const position = hasSelection
    ? toLatLng(parsedLatitude as number, parsedLongitude as number)
    : null;

  useEffect(() => {
    if (!position) {
      return;
    }

    map.setView(position, SELECTED_ZOOM);
  }, [map, position]);

  if (!position) {
    return null;
  }

  return (
    <Marker
      draggable
      eventHandlers={{
        dragend(event) {
          const latLng = event.target.getLatLng();
          onLatitudeChange(latLng.lat.toFixed(6));
          onLongitudeChange(latLng.lng.toFixed(6));
        },
      }}
      icon={createListingMarkerIcon()}
      position={position}
    >
      <Popup>
        <div className="space-y-1">
          <p className="font-semibold text-primary">{t("maps.selectedLocation")}</p>
          <p className="text-sm text-on-surface-variant">
            {city || address || t("maps.pickerHint")}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function LocationPickerMap({
  address,
  city,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: Props) {
  const { t } = useTranslation();
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  const hasSelection = isValidCoordinatePair(parsedLatitude, parsedLongitude);

  const center = useMemo<[number, number]>(
    () =>
      hasSelection
        ? [parsedLatitude as number, parsedLongitude as number]
        : DEFAULT_CENTER,
    [hasSelection, parsedLatitude, parsedLongitude],
  );

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container">
      <MapContainer
        center={center}
        className="h-full min-h-[280px] w-full"
        scrollWheelZoom={false}
        zoom={hasSelection ? SELECTED_ZOOM : DEFAULT_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSelectionController
          hasSelection={hasSelection}
          position={center}
          onLatitudeChange={onLatitudeChange}
          onLongitudeChange={onLongitudeChange}
        />
        {hasSelection ? (
          <SelectedLocationMarker
            address={address}
            city={city}
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={onLatitudeChange}
            onLongitudeChange={onLongitudeChange}
          />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 max-w-[240px] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold text-primary">{t("maps.pickerTitle")}</p>
        <p className="text-xs leading-relaxed text-on-surface-variant">
          {t("maps.pickerDescription")}
        </p>
      </div>
    </div>
  );
}
