import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

export function NotFoundPage() {
  return (
    <FeaturePlaceholder
      action={{ label: "Return home", to: "/" }}
      eyebrow="404"
      title="This route does not exist."
      description="Choose a workspace from the navigation or return to the DRAW2GAME home page."
    />
  );
}
