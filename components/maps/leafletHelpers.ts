import { divIcon, type LatLngExpression } from "leaflet";

const markerHtml = `
  <div style="
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #002627;
    border: 3px solid #cdebc5;
    box-shadow: 0 8px 20px rgba(0, 38, 39, 0.25);
  "></div>
`;

export function createListingMarkerIcon() {
  return divIcon({
    className: "",
    html: markerHtml,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export function isValidCoordinatePair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  );
}

export function toLatLng(
  latitude: number,
  longitude: number,
): LatLngExpression {
  return [latitude, longitude];
}
