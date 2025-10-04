"use client";

import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "./use-preferences";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { preferences } = usePreferences();

  
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!preferences.notifications) {
        return;
      }

      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      if (!("Notification" in window)) {
        console.warn("Notifications not supported");
        return;
      }

      try {
        const notification = new Notification(title, {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          ...options,
        });

        
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    },
    [permission, preferences.notifications]
  );

  
  const notifyNewEvent = useCallback(
    (eventTitle: string, eventCategory: string) => {
      if (!preferences.notifyNewEvents) return;

      sendNotification(`Nuevo evento: ${eventTitle}`, {
        body: `Categoría: ${eventCategory}`,
        tag: "new-event",
      });
    },
    [preferences.notifyNewEvents, sendNotification]
  );

  
  const notifyPriceChange = useCallback(
    (eventTitle: string, newPrice: string) => {
      if (!preferences.notifyPriceChanges) return;

      sendNotification(`¡Cambio de precio!`, {
        body: `${eventTitle} - Ahora: ${newPrice}`,
        tag: "price-change",
      });
    },
    [preferences.notifyPriceChanges, sendNotification]
  );

  
  const notifyNearbyEvent = useCallback(
    (eventTitle: string, distance: string) => {
      if (!preferences.notifyNearbyEvents) return;

      sendNotification(`Evento cerca de ti`, {
        body: `${eventTitle} - A ${distance} de distancia`,
        tag: "nearby-event",
      });
    },
    [preferences.notifyNearbyEvents, sendNotification]
  );

  return {
    permission,
    isSupported: "Notification" in window,
    requestPermission,
    sendNotification,
    notifyNewEvent,
    notifyPriceChange,
    notifyNearbyEvent,
  };
}
