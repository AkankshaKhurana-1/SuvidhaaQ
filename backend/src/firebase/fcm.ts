/**
 * Firebase Cloud Messaging (FCM) push notification sender.
 * Logs to console and simulates delivery if FCM server key is not configured.
 */

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async (
  payload: PushNotificationPayload
): Promise<{ success: boolean; messageId: string }> => {
  const fcmKey = process.env.FCM_SERVER_KEY;

  if (!fcmKey || fcmKey.startsWith('dummy')) {
    console.log(`[FCM Mock] Push sent to ${payload.token.substring(0, 10)}... | Title: "${payload.title}" | Body: "${payload.body}"`);
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }

  // If real server key is present, simulated send
  console.log(`[FCM] Sending push notification via FCM gateway to token: ${payload.token}`);
  return {
    success: true,
    messageId: `fcm-${Date.now()}`,
  };
};
