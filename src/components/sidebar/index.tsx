"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { NAV_ITEMS } from "@/constants/navigation";
import { SidebarHeader } from "./sidebar-header";
import { NavItem } from "./nav-item";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isInChat = pathname.startsWith("/chat");
  const { user, isLoading: isLoaded } = useAuth();

  const {
    conversations,
    currentConversationId,
    switchConversation,
  } = useChatHistory();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '80px' : '280px'
    );
  }, [isCollapsed]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const sidebarClasses = useMemo(
    () => `
      fixed left-0 top-0 h-screen bg-card border-r border-border
      transition-all duration-300 ease-in-out z-40
      ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
      ${!isMobile && isCollapsed ? "w-20" : "w-[280px]"}
    `,
    [isMobile, isOpen, isCollapsed]
  );

  return (
    <>
      {}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          onClick={handleClose}
        />
      )}

      {}
      {isMobile && !isOpen && (
        <button
          onClick={handleOpen}
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

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <SidebarHeader
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            onToggleCollapse={handleToggleCollapse}
            onClose={handleClose}
          />

          {}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isCollapsed={isCollapsed}
                  onClick={isMobile ? handleClose : undefined}
                />
              ))}
            </ul>
          </nav>

          {}
          {isInChat && !isCollapsed && conversations.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Conversaciones recientes
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {conversations.slice(0, 5).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      switchConversation(conv.id);
                      router.push(`/chat/${conv.id}`);
                      if (isMobile) handleClose();
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-xs transition-colors
                      ${currentConversationId === conv.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    <div className="truncate">{conv.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User section */}
          <div className="p-4 border-t border-border mt-auto">
            {/* User info */}
            {!isLoaded && user && !isCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email || "Sin email"}
                  </p>
                </div>
              </div>
            )}
            {!isLoaded && user && isCollapsed && (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
