-- Store the prior listing status so archived listings can be restored precisely.
ALTER TABLE "Listing"
ADD COLUMN "archivedFromStatus" "ListingStatus";
