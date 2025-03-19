import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useDivision } from "./useDivision";
import { Database } from "@/types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function useNotifications() {
  const { member } = useAuth();
  const { division } = useDivision();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!member?.division_id) {
      setIsLoading(false);
      return;
    }

    fetchNotifications();
    subscribeToNotifications();
  }, [member?.division_id]);

  async function fetchNotifications() {
    if (!member?.division_id) {
      setError(new Error("No division ID available"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch notifications for the user's division or global notifications
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .or(`division_id.eq.${member.division_id},division_id.is.null`)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read_by.includes(member.id)).length);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notifications"));
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToNotifications() {
    if (!member?.division_id) return;

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `division_id=eq.${member.division_id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function markAsRead(notificationId: string) {
    if (!member?.id) {
      throw new Error("No user ID available");
    }

    try {
      // First, get the current notification
      const { data: notification, error: fetchError } = await supabase
        .from("notifications")
        .select("read_by")
        .eq("id", notificationId)
        .single();

      if (fetchError) throw fetchError;

      // Update the read_by array
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          read_by: [...(notification?.read_by || []), member.id],
        })
        .eq("id", notificationId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_by: [...n.read_by, member.id] } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to mark notification as read");
    }
  }

  async function markAllAsRead() {
    if (!member?.id) {
      throw new Error("No user ID available");
    }

    try {
      // Get all unread notifications
      const { data: unreadNotifications, error: fetchError } = await supabase
        .from("notifications")
        .select("id, read_by")
        .not("read_by", "cs", `{${member.id}}`);

      if (fetchError) throw fetchError;

      // Update each notification
      for (const notification of unreadNotifications || []) {
        const { error: updateError } = await supabase
          .from("notifications")
          .update({
            read_by: [...(notification.read_by || []), member.id],
          })
          .eq("id", notification.id);

        if (updateError) throw updateError;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (!n.read_by.includes(member.id) ? { ...n, read_by: [...n.read_by, member.id] } : n))
      );
      setUnreadCount(0);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to mark all notifications as read");
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error: deleteError } = await supabase.from("notifications").delete().eq("id", notificationId);

      if (deleteError) throw deleteError;

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => {
        const deletedNotification = notifications.find((n) => n.id === notificationId);
        return deletedNotification && !deletedNotification.read_by.includes(member?.id ?? "")
          ? Math.max(0, prev - 1)
          : prev;
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete notification");
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
}
