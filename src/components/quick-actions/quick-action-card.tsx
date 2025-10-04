import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

type QuickActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
};

export const QuickActionCard = memo(function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: QuickActionCardProps) {
  return (
    <Card hoverable className="text-center" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4 text-primary" aria-hidden="true">
          {icon}
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
});
