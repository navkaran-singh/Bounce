package com.bounce.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class BounceWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Update all active widgets
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

        // 1. Read Data
        String score = prefs.getString("resilience_score", "--");
        String streak = prefs.getString("streak", "0");
        // ❌ REMOVE: String freeze = prefs.getString("freeze_tokens", "0");
        
        // Clean up the habit text
        String habit = prefs.getString("current_habit", "Bounce").replaceAll("^\"|\"$", "");

        // 2. Setup Layout
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.bounce_widget);

        // 3. Set The Visuals
        views.setTextViewText(R.id.appwidget_text, score);
        views.setTextViewText(R.id.appwidget_text_glow, score);
        
        // CHANGED: Use the Sprout icon for "Patient Growth"
        views.setTextViewText(R.id.widget_streak, "🌱 Day " + streak);
        
        // ❌ REMOVE: views.setTextViewText(R.id.widget_freeze, ...);
        
        // Set Habit Text
        views.setTextViewText(R.id.widget_habit, habit);

        // 4. Click Handler (Keep as is)
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.appwidget_text, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_habit, pendingIntent);

        // 5. Update
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}