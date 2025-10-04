import { ReactNode } from "react";

interface PageTitleProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function PageTitle({ icon, title, description }: PageTitleProps) {
  return (
    <header className="mb-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="w-8 h-8 text-primary">{icon}</div>}
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          {title}
        </h1>
      </div>
      {description && (
        <p className="text-base text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
