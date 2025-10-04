"use client";

import { Card, CardContent } from "./card";

interface StatCardProps {
  value: number;
  label: string;
  total?: number;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error";
  showProgress?: boolean;
}

export function StatCard({
  value,
  label,
  total,
  color = "primary",
  showProgress = false,
}: StatCardProps) {
  const percentage = total && total > 0 ? (value / total) * 100 : 0;

  const colorClasses = {
    primary: {
      text: "text-primary",
      bg: "bg-primary",
      ring: "stroke-primary",
      track: "stroke-primary/20",
    },
    secondary: {
      text: "text-secondary",
      bg: "bg-secondary",
      ring: "stroke-secondary",
      track: "stroke-secondary/20",
    },
    success: {
      text: "text-success",
      bg: "bg-success",
      ring: "stroke-success",
      track: "stroke-success/20",
    },
    info: {
      text: "text-info",
      bg: "bg-info",
      ring: "stroke-info",
      track: "stroke-info/20",
    },
    warning: {
      text: "text-warning",
      bg: "bg-warning",
      ring: "stroke-warning",
      track: "stroke-warning/20",
    },
    error: {
      text: "text-error",
      bg: "bg-error",
      ring: "stroke-error",
      track: "stroke-error/20",
    },
  };

  const colors = colorClasses[color];

  
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {}
          {showProgress && total ? (
            <div className="relative flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                {}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={colors.track}
                  strokeWidth="6"
                  fill="none"
                />
                {}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`${colors.ring} transition-all duration-500 ease-out`}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${colors.text}`}>
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`w-12 h-12 rounded-full ${colors.bg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}
            >
              <div className={`text-2xl font-bold ${colors.text}`}>
                {value}
              </div>
            </div>
          )}

          {}
          <div className="flex-1 min-w-0">
            <div className={`text-3xl font-bold ${colors.text} mb-1`}>
              {value}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {label}
            </div>
            {total && showProgress && (
              <div className="text-xs text-muted-foreground mt-1">
                de {total} total
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
