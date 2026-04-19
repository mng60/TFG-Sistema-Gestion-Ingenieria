package com.bluearc.mobile;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaDownloadsPlugin.class);
        super.onCreate(savedInstanceState);

        Intent launchIntent = getIntent();
        if (launchIntent != null && launchIntent.hasExtra("google.message_id")) {
            onNewIntent(launchIntent);
        }
    }
}
