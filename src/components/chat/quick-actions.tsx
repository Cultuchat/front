"use client";

import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  actions: string[];
  onActionClick: (action: string) => void;
}

export function QuickActions({ actions, onActionClick }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs h-7 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
          onClick={() => onActionClick(action)}
        >
          {action}
        </Button>
      ))}
    </div>
  );
}
