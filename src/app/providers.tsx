import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <Toaster closeButton position="top-right" richColors />
    </>
  );
}
