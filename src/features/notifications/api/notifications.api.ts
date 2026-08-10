import { apiRequest } from "@/lib/api/client";

export type NotificationItem = {
  id: string;
  type:
    | "TASK_ASSIGNED"
    | "TASK_MENTIONED"
    | "TASK_DUE_SOON"
    | "TASK_OVERDUE"
    | "TASK_BLOCKER_RESOLVED"
    | "HANDOVER_SUBMITTED"
    | "HANDOVER_ACCEPTED"
    | "HANDOVER_REJECTED"
    | "HANDOVER_CHANGES_REQUESTED"
    | "MEETING_INVITED"
    | "MEETING_UPDATED"
    | "MEETING_CANCELLED";
  title: string;
  body: string;
  link: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type NotificationType = NotificationItem["type"];
export type NotificationPreferences = { disabledTypes: NotificationType[] };

export function getNotifications(page = 1, limit = 20, unreadOnly = false) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), unreadOnly: String(unreadOnly) });
  return apiRequest<{ success: boolean; data: { items: NotificationItem[]; unreadCount: number; meta: { page: number; limit: number; total: number; totalPages: number } } }>(`/notifications?${query}`);
}

export function markNotificationRead(id: string) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}

export function archiveNotification(id: string) {
  return apiRequest(`/notifications/${id}/archive`, { method: "PATCH" });
}

export function getNotificationPreferences() {
  return apiRequest<{ success: boolean; data: NotificationPreferences }>("/notifications/preferences");
}

export function updateNotificationPreferences(preferences: NotificationPreferences) {
  return apiRequest<{ success: boolean; data: NotificationPreferences }>("/notifications/preferences", { method: "PATCH", body: preferences });
}
