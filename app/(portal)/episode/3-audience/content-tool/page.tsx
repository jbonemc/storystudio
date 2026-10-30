import { Suspense } from "react";
import { ContentToolPage } from "@/tools/content-tool/ContentToolPage";

export default function Page() {
  // ContentToolPage reads ?plan= from the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ContentToolPage />
    </Suspense>
  );
}
