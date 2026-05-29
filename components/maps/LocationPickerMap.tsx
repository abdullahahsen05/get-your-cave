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
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
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
  onAddressChange,
  onCityChange,
  onLatitudeChange,
  onLongitudeChange,
}: Pick<Props, "onLatitudeChange" | "onLongitudeChange"> & {
  hasSelection: boolean;
  position: [number, number];
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) {
  const map = useMapEvents({
    click(event) {
      onLatitudeChange(event.latlng.lat.toFixed(6));
      onLongitudeChange(event.latlng.lng.toFixed(6));
      void reverseGeocode(event.latlng.lat, event.latlng.lng);
    },
  });

  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const response = await fetch(
        `/api/geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
        {
          headers: { Accept: "application/json" },
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { address?: string; city?: string | null }
        | null;

      if (response.ok && data) {
        if (data.address) {
          onAddressChange(data.address);
        }

        if (data.city) {
          onCityChange(data.city);
        }
      }
    } catch {
      // Keep coordinates even if reverse geocoding fails.
    }
  }

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
  onAddressChange,
  onCityChange,
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
          void reverseGeocode(latLng.lat, latLng.lng);
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

  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const response = await fetch(
        `/api/geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
        {
          headers: { Accept: "application/json" },
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { address?: string; city?: string | null }
        | null;

      if (response.ok && data) {
        if (data.address) {
          onAddressChange(data.address);
        }

        if (data.city) {
          onCityChange(data.city);
        }
      }
    } catch {
      // Keep coordinates even if reverse geocoding fails.
    }
  }
}

export default function LocationPickerMap({
  address,
  city,
  latitude,
  longitude,
  onAddressChange,
  onCityChange,
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
    <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
      <MapContainer
        center={center}
        className="h-full w-full"
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
          onAddressChange={onAddressChange}
          onCityChange={onCityChange}
          onLatitudeChange={onLatitudeChange}
          onLongitudeChange={onLongitudeChange}
        />
        {hasSelection ? (
          <SelectedLocationMarker
            address={address}
            city={city}
            onAddressChange={onAddressChange}
            onCityChange={onCityChange}
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={onLatitudeChange}
            onLongitudeChange={onLongitudeChange}
          />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 max-w-[200px] rounded-2xl border border-outline-variant/60 bg-surface/95 px-3 py-2.5 shadow-[0_8px_30px_rgba(17,24,39,0.08)] sm:left-4 sm:top-4 sm:max-w-[240px] sm:px-4 sm:py-3">
        <p className="text-xs font-semibold text-primary sm:text-sm">{t("maps.pickerTitle")}</p>
        <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
          {t("maps.pickerDescription")}
        </p>
      </div>
    </div>
  );
}
