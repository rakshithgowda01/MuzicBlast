import { PageHeader } from "@/components/layout/page-header";
import { SearchPageClient } from "@/components/search/search-page-client";

export default function SearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Discovery"
        title="Search"
        description="Find songs from YouTube through the provider layer, then add them to your queue without coupling the UI to yt-dlp."
      />
      <SearchPageClient />
    </>
  );
}
