import { Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";

interface FeaturePlaceholderProps {
  action?: {
    label: string;
    to: string;
  };
  description: string;
  eyebrow: string;
  secondaryAction?: {
    label: string;
    to: string;
  };
  title: string;
}

export function FeaturePlaceholder({
  action,
  description,
  eyebrow,
  secondaryAction,
  title,
}: FeaturePlaceholderProps) {
  return (
    <PageContainer className="py-16 sm:py-24">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="bg-brand-50 text-brand-600 mx-auto grid size-12 place-items-center rounded-xl">
          <Construction aria-hidden="true" className="size-6" />
        </span>
        <p className="text-brand-600 mt-6 text-sm font-semibold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">{description}</p>
        {(action || secondaryAction) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {action && (
              <Button asChild>
                <Link to={action.to}>{action.label}</Link>
              </Button>
            )}
            {secondaryAction && (
              <Button asChild variant="outline">
                <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
