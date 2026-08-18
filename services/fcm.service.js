const admin = require('firebase-admin');
const { getFirebaseCredentials, isFcmConfigured } = require('../config/env');

let firebaseApp = null;

const getMessaging = () => {
  const credentials = getFirebaseCredentials();

  if (!credentials) {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert({
              projectId: credentials.projectId,
              clientEmail: credentials.clientEmail,
              privateKey: credentials.privateKey,
            }),
          });
  }

  return admin.messaging();
};

const toDataPayload = (data = {}) => {
  const payload = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    payload[String(key)] = typeof value === 'string' ? value : JSON.stringify(value);
  });

  return payload;
};

const sendPushToTokens = async ({ tokens, title, body, data }) => {
  const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];

  if (!isFcmConfigured() || uniqueTokens.length === 0) {
    return {
      configured: isFcmConfigured(),
      delivered: 0,
      failed: uniqueTokens.length,
      invalidTokens: [],
    };
  }

  const messaging = getMessaging();
  const dataPayload = toDataPayload(data);
  let delivered = 0;
  let failed = 0;
  const invalidTokens = [];

  const chunkSize = 500;

  for (let index = 0; index < uniqueTokens.length; index += chunkSize) {
    const chunk = uniqueTokens.slice(index, index + chunkSize);
    const response = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: {
        title,
        body,
      },
      data: dataPayload,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    response.responses.forEach((item, itemIndex) => {
      if (item.success) {
        delivered += 1;
        return;
      }

      failed += 1;
      const code = item.error && item.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(chunk[itemIndex]);
      }
    });
  }

  return {
    configured: true,
    delivered,
    failed,
    invalidTokens,
  };
};

module.exports = {
  sendPushToTokens,
};
