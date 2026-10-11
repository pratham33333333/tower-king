package com.codex.towerlines;
import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
public class GameActivity extends Activity {
 @Override public void onCreate(Bundle state) { super.onCreate(state); getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN); WebView game=new WebView(this); WebSettings settings=game.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); game.loadUrl("file:///android_asset/index.html"); setContentView(game); }
}
