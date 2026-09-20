import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

export function NotFoundPage() {
  return (
    <FeaturePlaceholder
      action={{ label: "Go to Dashboard", to: "/dashboard" }}
      description="Choose a project workspace from your dashboard or return to the DRAW2GAME home page."
      eyebrow="404"
      secondaryAction={{ label: "Return home", to: "/" }}
      title="This page does not exist."
    />
  );
}
