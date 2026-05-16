import ListingDetailPage from "@/components/listings/ListingDetailPage";

export default async function StorageListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ListingDetailPage listingId={id} />;
}

