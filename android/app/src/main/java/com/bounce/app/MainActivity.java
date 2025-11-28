package com.bounce.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import com.getcapacitor.BridgeActivity;

// 👇 ENSURE THIS MATCHES YOUR NEW JAVA FILE
import com.bounce.app.BounceWidget;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onPause() {
        super.onPause();
        // When app closes/pauses, force widget update
        updateMyWidgets();
    }

    private void updateMyWidgets() {
        Intent intent = new Intent(this, BounceWidget.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        
        int[] ids = AppWidgetManager.getInstance(getApplication())
                .getAppWidgetIds(new ComponentName(getApplication(), BounceWidget.class));
        
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        sendBroadcast(intent);
    }
}