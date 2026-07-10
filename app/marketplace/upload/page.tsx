import { Suspense } from "react";
import UploadPageClient from "./UploadPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPageClient />
    </Suspense>
  );
}