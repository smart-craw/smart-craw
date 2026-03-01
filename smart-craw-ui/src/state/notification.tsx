export type Notification = {
  message: string;
  notificationType: string;
};

type Action = Notification & { type: string };
const MAX_NOTIFICATIONS = 100; //keep to some realistic number
export function notificationReducer(
  notifications: Notification[],
  action: Action,
) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
      const { message, notificationType } = rest;
      const newNotifications = [
        ...notifications,
        { message, notificationType },
      ];
      return newNotifications.slice(-MAX_NOTIFICATIONS);
    }
    case "dismissed": {
      const { message, notificationType } = rest;
      return notifications.filter(
        (v) => v.message !== message && v.notificationType !== notificationType,
      );
      /*const newNotifications = [
        ...notifications,
        { message, type: notificationType },
      ];
      return newNotifications.slice(-MAX_NOTIFICATIONS);*/
    }

    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
