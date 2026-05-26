#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const EN_PATH = path.join(ROOT, "locales/en/common.json");
const FR_PATH = path.join(ROOT, "locales/fr/common.json");

const EN_VALUES = {
  "app.create.listing.page.text.text.d4925f55": "€",
  "app.layout.metadata.title": "GETYOURCAVE",
  "app.layout.metadata.description": "Architectural Serenity in Storage",
  "app.login.page.alt.a.clean.professionally.organized.high.end.a735372d":
    "A clean, professionally organized high-end storage facility with architectural lighting and polished concrete floors.",
  "app.page.text.56.f03e77a2": "56+",
  "app.page.text.196.000.35d964b2": "$196,000",
  "app.page.text.architectural.digest.8f4c4f21": "ARCHITECTURAL DIGEST",
  "app.page.text.wired.05625cc3": "WIRED",
  "app.page.text.forbes.67b27ed0": "FORBES",
  "app.page.text.dwell.3a89ab31": "DWELL",
  "app.page.text.monocle.3ec56edf": "MONOCLE",
  "app.page.text.120.85ee8a8e": "$120",
  "app.page.text.85.3c590424": "$85",
  "app.page.text.210.280b18c7": "$210",
  "app.page.text.12.000.eec2a821": "12,000+",
  "app.page.text.50.caee27b0": "50+",
  "app.page.text.99.9.e16badff": "99.9%",
  "app.renter.dashboard.page.text.text.3f2783f4": ", ",
  "app.renter.dashboard.page.text.text.b339b1c4": ": ",
  "app.renter.dashboard.page.text.mo.db706c4c": "/mo",
  "app.signup.page.alt.a.clean.professionally.organized.high.end.83eb8cd8":
    "A clean, professionally organized high-end storage facility with architectural lighting and polished concrete floors.",
  "app.signup.page.alt.google.logo.2b6f80a5": "Google Logo",
  "app.storage.page.text.text.33403ca3": "$",
  "auth.back": "Back",
  "auth.passwordPlaceholder": "••••••••",
  "components.admin.AdminDashboardWorkspace.alt.a.modern.secure.vault.interior.with.6e7393cf":
    "A modern secure vault interior with metallic shelving and warm lighting",
  "components.admin.AdminDashboardWorkspace.text.pending.users.bb62ad0b": "Pending Users",
  "components.admin.AdminDashboardWorkspace.text.role.fd5ee619": "Role",
  "components.invoices.InvoiceDetailPage.text.text.b1a23455": "← ",
  "components.invoices.InvoiceDetailPage.text.text.a2338170": ", ",
  "components.invoices.InvoiceDetailPage.text.text.9d4500d5": ": ",
  "components.layout.Footer.text.getyourcave.823e3085": "GETYOURCAVE",
  "components.layout.LanguageSwitcher.label.en": "EN",
  "components.layout.LanguageSwitcher.label.fr": "FR",
  "components.layout.LogoutButton.aria-label.sign.out.9e8634c9": "Sign out",
  "components.layout.Navbar.text.get.your.cave.5c627b86": "GETYOURCAVE",
  "components.listings.ListingDetailPage.text.text.17e45d65": ", ",
  "components.listings.ListingDetailPage.text.text.d4dc8bb5": "$",
  "components.maps.ListingsMap.text.text.c39b2add": "€",
  "createListing.location.currentCaptured": "Current location captured.",
  "createListing.location.currentCapturedNear": "Current location captured near {{name}}.",
  "createListing.location.enterQuery": "Please enter a location or address.",
  "createListing.location.foundLocation": "Location found: {{name}}.",
  "createListing.location.geoUnsupported": "Geolocation is not supported by this browser.",
  "createListing.location.locationUnavailable": "Unable to determine your current location.",
  "createListing.location.noResults": "No results found.",
  "createListing.location.permissionDenied": "Location permission was denied.",
  "createListing.location.searching": "Searching...",
  "createListing.steps.basicDetails": "Basic Details",
  "createListing.amenities.securityCamera": "Security camera",
  "createListing.amenities.access247": "24/7 access",
  "createListing.amenities.climateControl": "Climate control",
  "createListing.amenities.privateEntry": "Private entry",
  "createListing.amenities.gated": "Gated",
  "createListing.amenities.loadingDock": "Loading dock",
  "dashboard.renter.invoiceNumber": "Invoice #",
  "dashboard.renter.bookingColumn": "Booking",
  "dashboard.renter.amountColumn": "Amount",
  "dashboard.renter.statusColumn": "Status",
  "dashboard.admin.marketInsightSentence": "Market insight: {{label}} is {{value}}.",
};

const FR_OVERRIDES = {
  "app.layout.metadata.description": "Sérénité architecturale dans le stockage",
  "app.login.page.alt.a.clean.professionally.organized.high.end.a735372d":
    "Un espace de stockage haut de gamme propre et parfaitement organisé, avec un éclairage architectural et des sols en béton poli.",
  "app.signup.page.alt.a.clean.professionally.organized.high.end.83eb8cd8":
    "Un espace de stockage haut de gamme propre et parfaitement organisé, avec un éclairage architectural et des sols en béton poli.",
  "app.signup.page.alt.google.logo.2b6f80a5": "Logo Google",
  "auth.back": "Retour",
  "components.admin.AdminDashboardWorkspace.alt.a.modern.secure.vault.interior.with.6e7393cf":
    "Un coffre-fort moderne et sécurisé avec des rayonnages métalliques et un éclairage chaleureux",
  "components.admin.AdminDashboardWorkspace.text.pending.users.bb62ad0b": "Utilisateurs en attente",
  "components.admin.AdminDashboardWorkspace.text.role.fd5ee619": "Rôle",
  "components.layout.LogoutButton.aria-label.sign.out.9e8634c9": "Se déconnecter",
  "createListing.location.currentCaptured": "Position actuelle capturée.",
  "createListing.location.currentCapturedNear": "Position actuelle capturée près de {{name}}.",
  "createListing.location.enterQuery": "Veuillez saisir un lieu ou une adresse.",
  "createListing.location.foundLocation": "Lieu trouvé : {{name}}.",
  "createListing.location.geoUnsupported": "La géolocalisation n’est pas prise en charge par ce navigateur.",
  "createListing.location.locationUnavailable": "Impossible de déterminer votre position actuelle.",
  "createListing.location.noResults": "Aucun résultat trouvé.",
  "createListing.location.permissionDenied": "L’autorisation de localisation a été refusée.",
  "createListing.location.searching": "Recherche en cours...",
  "createListing.errors.latitudeRange": "La latitude doit être comprise entre -90 et 90.",
  "createListing.errors.longitudeRange": "La longitude doit être comprise entre -180 et 180.",
  "dashboard.owner.invoiceNumber": "Facture #",
  "dashboard.owner.bookingColumn": "Réservation",
  "dashboard.owner.amountColumn": "Montant",
  "dashboard.owner.statusColumn": "Statut",
  "messaging.noMessages": "Aucun message pour le moment.",
  "dashboard.admin.marketInsightSentence": "Aperçu du marché : {{label}} est à {{value}}.",
};

function deepSet(target, keyPath, value) {
  const parts = keyPath.split(".");
  let current = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

function mergeMissing(base, additions) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(additions)) {
    deepSet(result, key, value);
  }
  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const en = readJson(EN_PATH);
const fr = readJson(FR_PATH);

const nextEn = mergeMissing(en, EN_VALUES);
const nextFr = mergeMissing(fr, { ...EN_VALUES, ...FR_OVERRIDES });

writeJson(EN_PATH, nextEn);
writeJson(FR_PATH, nextFr);

console.log(
  `Synced ${Object.keys(EN_VALUES).length} missing translation keys into en and fr locale JSON files.`,
);
