import fs from "node:fs/promises";
import path from "node:path";

import PizZip from "pizzip";

const cwd = process.cwd();
const originalDir = path.join(cwd, "docs/original");
const templateDir = path.join(cwd, "docs/templates");

function replaceAll(value, search, replacement) {
  return value.split(search).join(replacement);
}

function replaceNth(value, search, occurrence, replacement) {
  let index = -1;
  let fromIndex = 0;

  for (let count = 0; count <= occurrence; count += 1) {
    index = value.indexOf(search, fromIndex);
    if (index === -1) {
      return value;
    }
    fromIndex = index + search.length;
  }

  return `${value.slice(0, index)}${replacement}${value.slice(index + search.length)}`;
}

function rewriteXml(xml, replacements) {
  let output = xml;
  for (const { search, replacement, nth } of replacements) {
    if (search instanceof RegExp) {
      output = output.replace(search, replacement);
      continue;
    }

    output =
      typeof nth === "number"
        ? replaceNth(output, search, nth, replacement)
        : replaceAll(output, search, replacement);
  }
  return output;
}

const seasonalReplacements = [
  {
    search: "Le Bailleur : ",
    replacement: "Le Bailleur : {owner_name}",
  },
  {
    search: "Le Locataire : ",
    replacement: "Le Locataire : {renter_name}",
  },
  {
    search: "Contrat n° : ____________     Date : ____________",
    replacement: "Contrat n° : {contract_number}     Date : {today_date}",
  },
  {
    search: "La cave objet du présent contrat est située à l'adresse suivante :",
    replacement:
      "La cave objet du présent contrat est située à l'adresse suivante : {listing_address}",
  },
  {
    search:
      "Le présent contrat est conclu pour une durée saisonnière du \n____ / ____ / ______\n____ / ____ / ______\n, soit _____ semaines.",
    replacement:
      "Le présent contrat est conclu pour une durée saisonnière du {start_date} au {end_date}, soit {duration_weeks} semaines.",
  },
  {
    search: "Loyer mensuel (TTC) :",
    replacement: "Loyer mensuel (TTC) : {monthly_price} €",
  },
  {
    search:
      "________________ €\n est exigible à la signature du présent contrat. Il sera restitué au locataire dans un délai de 15 jours suivant la restitution des clés, déduction faite de toute somme due au titre de dommages ou loyers impayés.",
    replacement:
      "{deposit_amount} € est exigible à la signature du présent contrat. Il sera restitué au locataire dans un délai de 15 jours suivant la restitution des clés, déduction faite de toute somme due au titre de dommages ou loyers impayés.",
  },
  {
    search:
      /LE BAILLEUR[\s\S]*?Nom &amp; Prénom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE BAILLEUR\nNom & Prénom : {owner_name}\nDate : {today_date}\nSignature :",
  },
  {
    search:
      /LE LOCATAIRE[\s\S]*?Nom &amp; Prénom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE LOCATAIRE\nNom & Prénom : {renter_name}\nDate : {today_date}\nSignature :",
  },
];

const longTermReplacements = [
  {
    search: "Le Bailleur : ",
    replacement: "Le Bailleur : {owner_name}",
  },
  {
    search: "Le Locataire : ",
    replacement: "Le Locataire : {renter_name}",
  },
  {
    search: "Contrat n° : ____________     Date : ____________",
    replacement: "Contrat n° : {contract_number}     Date : {today_date}",
  },
  {
    search: "La cave objet du présent contrat est située à l'adresse suivante :",
    replacement:
      "La cave objet du présent contrat est située à l'adresse suivante : {listing_address}",
  },
  {
    search:
      "Le présent bail est consenti pour une durée de \n_____ mois\n____ / ____ / ______\n. Il se renouvellera automatiquement par période de _____ mois, sauf résiliation dans les conditions prévues à l'article 10.",
    replacement:
      "Le présent bail est consenti pour une durée de {duration_months} mois à compter du {start_date}. Il se renouvellera automatiquement par période de {duration_months} mois, sauf résiliation dans les conditions prévues à l'article 10.",
  },
  {
    search: "Loyer mensuel hors charges (€) :",
    replacement: "Loyer mensuel hors charges (€) : {monthly_price} €",
  },
  {
    search: "Charges forfaitaires (€/mois) :",
    replacement: "Charges forfaitaires (€/mois) : {insurance_fee} €",
  },
  {
    search:
      "Le locataire verse à la signature un dépôt de garantie de \n________________ €\n (équivalant à _____ mois de loyer hors charges). Ce dépôt sera restitué dans un délai de 30 jours suivant la remise des clés et l'état des lieux de sortie, déduction faite des éventuelles sommes dues.",
    replacement:
      "Le locataire verse à la signature un dépôt de garantie de {deposit_amount} € (équivalant à _____ mois de loyer hors charges). Ce dépôt sera restitué dans un délai de 30 jours suivant la remise des clés et l'état des lieux de sortie, déduction faite des éventuelles sommes dues.",
  },
  {
    search: /LE BAILLEUR[\s\S]*?Nom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE BAILLEUR\nNom : {owner_name}\nDate : {today_date}\nSignature :",
  },
  {
    search: /LE LOCATAIRE[\s\S]*?Nom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE LOCATAIRE\nNom : {renter_name}\nDate : {today_date}\nSignature :",
  },
];

const intermediationReplacements = [
  {
    search: "Le Bailleur : ",
    replacement: "Le Bailleur : {owner_name}",
  },
  {
    search: "Le Locataire : ",
    replacement: "Le Locataire : {renter_name}",
  },
  {
    search: "Réf. : ____________     Date : ____________",
    replacement: "Réf. : {contract_number}     Date : {today_date}",
  },
  {
    search: "RCS de ____________",
    replacement: "RCS de {platform_rcs_city}",
  },
  {
    search: "SIRET : ________________________",
    replacement: "SIRET : {platform_siret}",
  },
  {
    search: "siège social est situé à : _____________________________________",
    replacement: "siège social est situé à : {platform_address}",
  },
  {
    search: "représentée par ___________________,",
    replacement: "représentée par {platform_representative},",
  },
  {
    search:
      "GetYourCave\n — société immatriculée au RCS de ____________, SIRET : ________________________, dont le siège social est situé à : _____________________________________, représentée par ___________________,",
    replacement:
      "GetYourCave\n — société immatriculée au RCS de {platform_rcs_city}, SIRET : {platform_siret}, dont le siège social est situé à : {platform_address}, représentée par {platform_representative},",
  },
  {
    search: "Type de location :   □ Saisonnière   □ Longue durée   □ À définir entre les parties",
    replacement: "Type de location : {contract_type_label}",
  },
  {
    search:
      "Commission Bailleur : \n_____ % du loyer mensuel HT, facturé _____ (mensuellement / annuellement / à la mise en relation).",
    replacement:
      "Commission Bailleur : {platform_commission_rate} % du loyer mensuel HT, facturé {platform_commission_frequency}.",
  },
  {
    search:
      "Commission Locataire : \n_____ % du loyer mensuel HT ou forfait fixe de _______ €, exigible à la signature du contrat de location.",
    replacement:
      "Commission Locataire : {platform_commission_rate} % du loyer mensuel HT ou forfait fixe de {platform_commission_fixed} €, exigible à la signature du contrat de location.",
  },
  {
    search:
      "Le présent contrat prend effet à compter de sa signature et pour une durée de \n_____ mois\n. Il prend fin automatiquement à la conclusion du contrat de location entre les parties ou à l'expiration du délai susvisé sans qu'une mise en relation n'ait abouti.",
    replacement:
      "Le présent contrat prend effet à compter de sa signature et pour une durée de {platform_duration_months} mois. Il prend fin automatiquement à la conclusion du contrat de location entre les parties ou à l'expiration du délai susvisé sans qu'une mise en relation n'ait abouti.",
  },
  {
    search: /LE BAILLEUR[\s\S]*?Nom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE BAILLEUR\nNom : {owner_name}\nDate : {today_date}\nSignature :",
  },
  {
    search: /LE LOCATAIRE[\s\S]*?Nom :\s*_+\s*Date :\s*_+\s*Signature :/,
    replacement:
      "LE LOCATAIRE\nNom : {renter_name}\nDate : {today_date}\nSignature :",
  },
  {
    search:
      /GETYOURCAVE[\s\S]*?Représentant\(e\) :\s*_+\s*Date :\s*_+/,
    replacement:
      "GETYOURCAVE\nReprésentant(e) : {platform_representative}\nDate : {today_date}",
  },
];

const templateMap = [
  {
    source: "GYC_Contrat_Location_Saisonniere.docx",
    target: "GYC_Contrat_Location_Saisonniere.template.docx",
    replacements: seasonalReplacements,
  },
  {
    source: "GYC_Contrat_Location_Longue_Duree.docx",
    target: "GYC_Contrat_Location_Longue_Duree.template.docx",
    replacements: longTermReplacements,
  },
  {
    source: "GYC_Contrat_Mise_En_Relation.docx",
    target: "GYC_Contrat_Mise_En_Relation.template.docx",
    replacements: intermediationReplacements,
  },
];

async function buildTemplate({ source, target, replacements }) {
  const inputPath = path.join(originalDir, source);
  const outputPath = path.join(templateDir, target);
  const buffer = await fs.readFile(inputPath);
  const zip = new PizZip(buffer);

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.endsWith(".xml")) {
      continue;
    }

    const file = zip.file(fileName);
    if (!file) {
      continue;
    }

    const xml = file.asText();
    const rewritten = rewriteXml(xml, replacements);
    zip.file(fileName, rewritten);
  }

  await fs.writeFile(outputPath, zip.generate({ type: "nodebuffer" }));
}

async function main() {
  await fs.mkdir(templateDir, { recursive: true });
  for (const template of templateMap) {
    await buildTemplate(template);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
