"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
};

export const NavItem = memo(function NavItem({
  href,
  icon,
  label,
  isCollapsed,
  onClick,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`
          flex items-center gap-3 p-3 rounded-lg
          transition-smooth min-h-[44px]
          ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-foreground"
          }
          focus-visible:outline-ring
        `}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="flex-shrink-0">{icon}</span>
        {!isCollapsed && (
          <span className="animate-fadeIn font-medium">{label}</span>
        )}
      </Link>
    </li>
  );
});
