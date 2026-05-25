"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useTranslation } from "react-i18next";

import {
  createListingMarkerIcon,
  isValidCoordinatePair,
  toLatLng,
} from "@/components/maps/leafletHelpers";

type Props = {
  title: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export default function ListingMap({
  title,
  city,
  address,
  latitude,
  longitude,
}: Props) {
  const { t } = useTranslation();
  if (!isValidCoordinatePair(latitude, longitude)) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[#EBEBE8] bg-surface-container-lowest px-6 text-center shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
        <div className="max-w-md space-y-2">
          <p className="font-h3 text-h3 text-primary">{t("maps.title")}</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            {t("maps.noCoordinates")}
          </p>
        </div>
      </div>
    );
  }

  const safeLatitude = latitude as number;
  const safeLongitude = longitude as number;
  const position = toLatLng(safeLatitude, safeLongitude);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EBEBE8] bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
      <MapContainer
        center={position}
        className="h-[360px] w-full"
        scrollWheelZoom={false}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker icon={createListingMarkerIcon()} position={position}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-primary">{title}</p>
              <p className="text-sm text-on-surface-variant">
                {city}
                {address ? ` ? ${address}` : ""}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
