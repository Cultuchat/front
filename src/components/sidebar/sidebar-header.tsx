"use client";

import { memo } from "react";
import { ThemeToggle } from "./theme-toggle";

type SidebarHeaderProps = {
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
};

export const SidebarHeader = memo(function SidebarHeader({
  isCollapsed,
  isMobile,
  onToggleCollapse,
  onClose,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      {!isCollapsed && (
        <h1 className="text-xl font-bold text-primary animate-fadeIn">
          CultuChat
        </h1>
      )}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isMobile && (
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg hover:bg-muted transition-smooth
              focus-visible:outline-ring min-w-[44px] min-h-[44px]
              flex items-center justify-center md:hidden
            "
            aria-label="Cerrar menú"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="
              p-2 rounded-lg hover:bg-muted transition-smooth
              focus-visible:outline-ring min-w-[44px] min-h-[44px]
              flex items-center justify-center
            "
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
