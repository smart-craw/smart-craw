export type Notification = {
  message: string;
  notificationType: string;
};

export type NotificationAction = Notification & { type: string };
//const MAX_NOTIFICATIONS = 100; //keep to some realistic number
export const notificationAction = {
  ADDED: "added",
  DISMISSED: "dismissed",
} as const;
export function notificationReducer(
  _notification: Notification | null,
  action: NotificationAction,
) {
  const { type, ...rest } = action;
  switch (type) {
    case notificationAction.ADDED: {
      const { message, notificationType } = rest;
      /*const newNotifications = [
        ...notifications,
        { message, notificationType },
      ];
      return newNotifications.slice(-MAX_NOTIFICATIONS);*/
      return { message, notificationType };
    }
    /*case notificationAction.DISMISSED: {
      const { message, notificationType } = rest;
      return notifications.filter(
        (v) => v.message !== message && v.notificationType !== notificationType,
      );
    }*/

    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
