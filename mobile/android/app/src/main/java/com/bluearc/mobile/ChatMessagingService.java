package com.bluearc.mobile;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Process;
import android.service.notification.StatusBarNotification;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ChatMessagingService extends MessagingService {
    private static final String CHANNEL_ID = "chat_messages";
    private static final String GROUP_KEY_CHAT = "com.bluearc.mobile.chat";
    private static final String EXTRA_HISTORY_JSON = "chat_history_json";
    private static final int MAX_HISTORY_MESSAGES = 5;
    private static final int SUMMARY_NOTIFICATION_ID = 49000;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getData().isEmpty()) return;

        String type = remoteMessage.getData().get("type");
        if (!"chat".equals(type)) return;

        if (isAppInForeground()) {
          return;
        }

        showChatNotification(remoteMessage);
    }

    private void showChatNotification(@NonNull RemoteMessage remoteMessage) {
        String conversationId = getValue(remoteMessage, "conversacion_id");
        if (conversationId.isEmpty()) return;

        String senderName = getValue(remoteMessage, "sender_name");
        String title = getValue(remoteMessage, "title");
        String body = getValue(remoteMessage, "message_body");
        String messageId = getValue(remoteMessage, "message_id");
        String conversationType = getValue(remoteMessage, "conversacion_tipo");
        String conversationName = getValue(remoteMessage, "conversacion_nombre");
        String createdAt = getValue(remoteMessage, "message_created_at");

        if (body.isEmpty()) {
            body = getValue(remoteMessage, "body");
        }

        if (title.isEmpty()) {
            title = !conversationName.isEmpty() ? conversationName : senderName;
        }

        boolean isGroupConversation = "proyecto_grupo".equals(conversationType);
        String notificationTag = "chat_" + conversationId;
        int notificationId = Math.abs(notificationTag.hashCode());

        JSONArray history = loadExistingHistory(notificationTag, notificationId);
        appendMessage(history, messageId, senderName, body, createdAt);

        Bundle extras = buildExtras(remoteMessage, history);
        PendingIntent pendingIntent = buildContentIntent(remoteMessage, notificationId);

        Person senderPerson = new Person.Builder()
            .setName(senderName.isEmpty() ? "Usuario" : senderName)
            .build();

        NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(senderPerson)
            .setGroupConversation(isGroupConversation);

        if (isGroupConversation && !conversationName.isEmpty()) {
            messagingStyle.setConversationTitle(conversationName);
        } else if (!title.isEmpty()) {
            messagingStyle.setConversationTitle(title);
        }

        for (int i = 0; i < history.length(); i++) {
            JSONObject entry = history.optJSONObject(i);
            if (entry == null) continue;

            String entryText = entry.optString("body", body);
            String entrySender = entry.optString("sender_name", senderName);
            long timestamp = entry.optLong("timestamp", System.currentTimeMillis());

            messagingStyle.addMessage(
                entryText,
                timestamp,
                new Person.Builder().setName(entrySender.isEmpty() ? "Usuario" : entrySender).build()
            );
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(messagingStyle)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setShowWhen(true)
            .setOnlyAlertOnce(false)
            .setGroup(GROUP_KEY_CHAT)
            .setExtras(extras)
            .build();

        NotificationManagerCompat.from(this).notify(notificationTag, notificationId, notification);
        showGroupSummary(history.length(), title, body);
    }

    private void showGroupSummary(int conversationMessageCount, String title, String body) {
        Bundle summaryExtras = new Bundle();
        summaryExtras.putString("type", "chat");
        summaryExtras.putString("group_summary", "true");

        Notification summaryNotification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Mensajes nuevos")
            .setContentText(title + ": " + body)
            .setStyle(new NotificationCompat.InboxStyle()
                .setSummaryText(conversationMessageCount + " mensajes recientes")
                .addLine(title + ": " + body))
            .setGroup(GROUP_KEY_CHAT)
            .setGroupSummary(true)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setExtras(summaryExtras)
            .build();

        NotificationManagerCompat.from(this).notify(SUMMARY_NOTIFICATION_ID, summaryNotification);
    }

    private PendingIntent buildContentIntent(RemoteMessage remoteMessage, int requestCode) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        Bundle extras = new Bundle();
        for (String key : remoteMessage.getData().keySet()) {
            extras.putString(key, remoteMessage.getData().get(key));
        }

        String messageId = remoteMessage.getMessageId();
        if (messageId == null || messageId.isEmpty()) {
            messageId = "chat-" + getValue(remoteMessage, "conversacion_id") + "-" + System.currentTimeMillis();
        }

        extras.putString("google.message_id", messageId);
        intent.putExtras(extras);

        return PendingIntent.getActivity(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private Bundle buildExtras(RemoteMessage remoteMessage, JSONArray history) {
        Bundle extras = new Bundle();
        for (String key : remoteMessage.getData().keySet()) {
            extras.putString(key, remoteMessage.getData().get(key));
        }
        extras.putString(EXTRA_HISTORY_JSON, history.toString());
        extras.putString(Notification.EXTRA_TITLE, getValue(remoteMessage, "title"));
        extras.putString(Notification.EXTRA_TEXT, getValue(remoteMessage, "message_body"));
        return extras;
    }

    private JSONArray loadExistingHistory(String notificationTag, int notificationId) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) {
            return new JSONArray();
        }

        StatusBarNotification[] activeNotifications = notificationManager.getActiveNotifications();
        for (StatusBarNotification activeNotification : activeNotifications) {
            String activeTag = activeNotification.getTag();
            int activeId = activeNotification.getId();

            if (notificationId != activeId || !notificationTag.equals(activeTag)) {
                continue;
            }

            String historyJson = activeNotification.getNotification().extras.getString(EXTRA_HISTORY_JSON);
            if (historyJson == null || historyJson.isEmpty()) {
                return new JSONArray();
            }

            try {
                return new JSONArray(historyJson);
            } catch (JSONException ignored) {
                return new JSONArray();
            }
        }

        return new JSONArray();
    }

    private void appendMessage(JSONArray history, String messageId, String senderName, String body, String createdAt) {
        if (!messageId.isEmpty()) {
            for (int i = 0; i < history.length(); i++) {
                JSONObject existing = history.optJSONObject(i);
                if (existing != null && messageId.equals(existing.optString("message_id"))) {
                    return;
                }
            }
        }

        JSONObject message = new JSONObject();
        try {
            message.put("message_id", messageId);
            message.put("sender_name", senderName);
            message.put("body", body);
            message.put("timestamp", parseTimestamp(createdAt));
        } catch (JSONException ignored) {
            return;
        }

        history.put(message);

        if (history.length() <= MAX_HISTORY_MESSAGES) {
            return;
        }

        List<JSONObject> trimmed = new ArrayList<>();
        for (int i = Math.max(0, history.length() - MAX_HISTORY_MESSAGES); i < history.length(); i++) {
            JSONObject item = history.optJSONObject(i);
            if (item != null) {
                trimmed.add(item);
            }
        }

        while (history.length() > 0) {
            history.remove(0);
        }

        for (JSONObject item : trimmed) {
            history.put(item);
        }
    }

    private long parseTimestamp(String createdAt) {
        if (createdAt == null || createdAt.isEmpty()) {
            return System.currentTimeMillis();
        }

        try {
            return java.time.Instant.parse(createdAt).toEpochMilli();
        } catch (Exception ignored) {
            return System.currentTimeMillis();
        }
    }

    private String getValue(RemoteMessage remoteMessage, String key) {
        String value = remoteMessage.getData().get(key);
        return value == null ? "" : value;
    }

    private boolean isAppInForeground() {
        ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager == null) {
            return false;
        }

        List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
        if (appProcesses == null) {
            return false;
        }

        String packageName = getPackageName();
        for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
            if (appProcess.pid == Process.myPid()) {
                return appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    || appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
            }

            if (packageName.equals(appProcess.processName)) {
                return appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    || appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
            }
        }

        return false;
    }
}
