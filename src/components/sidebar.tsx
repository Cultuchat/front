"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./theme-provider";

type SidebarProps = {
  children?: React.ReactNode;
};

export function Sidebar({}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-card rounded-lg shadow-lg md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Abrir menú"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen bg-card border-r border-border
          transition-all duration-300 ease-in-out z-40
          ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          ${!isMobile && isCollapsed ? "w-20" : "w-[280px]"}
        `}
      >
      <div className="flex flex-col h-full">
        {}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-primary animate-fadeIn">
              CultuChat
            </h1>
          )}
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
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
                onClick={() => setIsCollapsed(!isCollapsed)}
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

        {}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            <NavItem
              icon={
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              }
              label="Inicio"
              isCollapsed={isCollapsed}
              active
            />
            <NavItem
              icon={
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              label="Eventos"
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              }
              label="Favoritos"
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              }
              label="Mapa"
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              label="Historial"
              isCollapsed={isCollapsed}
            />
          </ul>
        </nav>

        {}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleTheme}
            className="
              w-full p-3 rounded-lg hover:bg-muted transition-smooth
              flex items-center gap-3 min-h-[44px]
              focus-visible:outline-ring
            "
            aria-label="Cambiar tema"
          >
            {theme === "light" ? (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
            {!isCollapsed && (
              <span className="animate-fadeIn">
                {theme === "light" ? "Modo oscuro" : "Modo claro"}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  active?: boolean;
};

function NavItem({ icon, label, isCollapsed, active }: NavItemProps) {
  return (
    <li>
      <a
        href="#"
        className={`
          flex items-center gap-3 p-3 rounded-lg
          transition-smooth min-h-[44px]
          ${
            active
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-foreground"
          }
          focus-visible:outline-ring
        `}
        aria-label={label}
      >
        <span className="flex-shrink-0">{icon}</span>
        {!isCollapsed && <span className="animate-fadeIn font-medium">{label}</span>}
      </a>
    </li>
  );
}
