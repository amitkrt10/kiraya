"use client";

import { useEffect } from "react";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StandalonePage>
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. Try again, and if it keeps happening, let your admin know."
        onRetry={reset}
      />
    </StandalonePage>
  );
}
