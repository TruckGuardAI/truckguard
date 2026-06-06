class NotificationsService {
async initialize(): Promise<void> {
console.log('Notifications disabled for debugging');
}
async send(
title: string,
body: string
): Promise<void> {
console.log('Notification:', title, body);
}
}
export const notificationsService =
new NotificationsService();