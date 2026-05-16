# Contract Placeholders

These placeholders are used in the reusable DOCX templates under `docs/templates`.

## Core placeholders

| Placeholder | Meaning | Used by |
| --- | --- | --- |
| `{booking_id}` | Booking reference number from the booking record | Seasonal, Long-term |
| `{booking_number}` | Alias for the booking reference number | Seasonal, Long-term, Intermediation |
| `{contract_number}` | Unique generated contract reference | All templates |
| `{contract_type}` | Internal contract type enum | All templates |
| `{contract_type_label}` | Human-readable contract type | All templates |
| `{today_date}` | Date contract was generated | All templates |
| `{start_date}` | Booking start date | Seasonal, Long-term |
| `{end_date}` | Booking end date | Seasonal, Long-term |
| `{duration_months}` | Duration in months | Long-term, Intermediation |
| `{duration_weeks}` | Duration in weeks | Seasonal |

## Party placeholders

| Placeholder | Meaning | Used by |
| --- | --- | --- |
| `{owner_name}` | Owner full name | All templates |
| `{owner_email}` | Owner email address | Seasonal, Long-term |
| `{owner_phone}` | Owner phone number | Seasonal, Long-term |
| `{owner_address}` | Owner profile address | Seasonal, Long-term |
| `{renter_name}` | Renter full name | All templates |
| `{renter_email}` | Renter email address | Seasonal, Long-term |
| `{renter_phone}` | Renter phone number | Seasonal, Long-term |
| `{renter_address}` | Renter profile address | Seasonal, Long-term |

## Listing placeholders

| Placeholder | Meaning | Used by |
| --- | --- | --- |
| `{listing_name}` | Listing title | All templates |
| `{listing_address}` | Full listing address | All templates |
| `{listing_city}` | Listing city | All templates |
| `{listing_postal_code}` | Listing postal code | All templates |
| `{listing_storage_type}` | Storage type enum | All templates |

## Pricing placeholders

| Placeholder | Meaning | Used by |
| --- | --- | --- |
| `{monthly_price}` | Monthly rental price | All templates |
| `{security_deposit}` | Security deposit amount | Seasonal, Long-term |
| `{deposit_amount}` | Alias for the deposit amount | Seasonal, Long-term |
| `{insurance_fee}` | Insurance fee amount | Seasonal, Long-term |
| `{platform_commission}` | Platform commission amount | Seasonal, Long-term |
| `{owner_amount}` | Owner net amount | Seasonal, Long-term |
| `{total_monthly_amount}` | Total monthly charge | Seasonal, Long-term |

## Platform placeholders

| Placeholder | Meaning | Used by |
| --- | --- | --- |
| `{platform_company_name}` | Platform legal name | Intermediation |
| `{platform_rcs_city}` | City where the platform is registered | Intermediation |
| `{platform_siret}` | Platform SIRET | Intermediation |
| `{platform_address}` | Platform legal address | Intermediation |
| `{platform_representative}` | Platform legal representative | Intermediation |
| `{platform_email}` | Platform contact email | Intermediation |
| `{platform_website}` | Platform website | Intermediation |
| `{platform_commission_rate}` | Platform commission percentage | Intermediation |
| `{platform_commission_frequency}` | Commission billing cadence | Intermediation |
| `{platform_commission_fixed}` | Fixed commission amount | Intermediation |
| `{platform_duration_months}` | Intermediation contract duration | Intermediation |

## Notes

- Placeholders use **single braces** only.
- Keep each placeholder in a single Word text run whenever possible.
- The generation service will fill placeholders from booking, listing, profile, and platform metadata.
