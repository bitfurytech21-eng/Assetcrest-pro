import type { Request, Response } from 'express';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

interface PackagePayload {
  appName?: string;
  packageName?: string;
  versionName?: string;
  versionCode?: number;
  themeColor?: string;
  targetUrl?: string;
  enablePush?: boolean;
}

function sanitizePackageName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '');
  const parts = cleaned.split('.').filter(Boolean);
  if (parts.length < 2) return 'com.assetcrest.investor';
  return parts
    .map((p) => (/^[a-z]/.test(p) ? p : `app${p}`))
    .join('.');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function handleApkPackagePost(req: Request, res: Response) {
  try {
    let body: PackagePayload = {};
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8').trim();
      if (text) body = JSON.parse(text) as PackagePayload;
    } else if (typeof req.body === 'string') {
      if (req.body.trim()) body = JSON.parse(req.body) as PackagePayload;
    } else if (req.body && typeof req.body === 'object') {
      body = req.body as PackagePayload;
    }

    const appName = (body.appName || 'AssetCrest Pro').trim().slice(0, 48) || 'AssetCrest Pro';
    const packageName = sanitizePackageName(body.packageName || 'com.assetcrest.investor');
    const versionName = (body.versionName || '1.0.4').replace(/[^0-9.]/g, '') || '1.0.4';
    const versionCode =
      Number.isFinite(body.versionCode) && (body.versionCode ?? 0) > 0
        ? Math.floor(body.versionCode as number)
        : 4;
    const themeColor = /^#[0-9a-fA-F]{6}$/.test(body.themeColor || '')
      ? body.themeColor!
      : '#0f172a';
    const fallbackOrigin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const targetUrlRaw = (body.targetUrl || process.env.APP_URL || fallbackOrigin).trim();
    const targetUrl =
      targetUrlRaw.startsWith('http://') || targetUrlRaw.startsWith('https://')
        ? targetUrlRaw
        : `https://${targetUrlRaw}`;
    const enablePush = body.enablePush !== false;

    let parsedHost = 'assetcrest.app';
    try {
      parsedHost = new URL(targetUrl).host;
    } catch {
      parsedHost = 'assetcrest.app';
    }

    const pkgPath = packageName.replace(/\./g, '/');
    const zip = new JSZip();

    const twaManifest = {
      packageId: packageName,
      host: parsedHost,
      name: appName,
      launcherName: appName.slice(0, 12),
      display: 'standalone',
      themeColor,
      themeColorDark: '#090d16',
      navigationColor: themeColor,
      navigationColorDark: '#090d16',
      navigationDividerColor: themeColor,
      navigationDividerColorDark: '#090d16',
      backgroundColor: '#090d16',
      enableNotifications: enablePush,
      startUrl: '/',
      iconUrl: `${targetUrl.replace(/\/$/, '')}/icon-512.png`,
      maskableIconUrl: `${targetUrl.replace(/\/$/, '')}/icon-maskable-512.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'android',
      },
      appVersionName: versionName,
      appVersionCode: versionCode,
      shortcuts: [],
      generatorApp: 'AssetCrest-APK-Studio',
      webManifestUrl: `${targetUrl.replace(/\/$/, '')}/manifest.json`,
      fallbackType: 'customtabs',
      features: {},
      alphaDependencies: { enabled: false },
      enableSiteSettingsShortcut: true,
      isChromeOSOnly: false,
      isMetaQuest: false,
      minSdkVersion: 23,
    };

    zip.file('twa-manifest.json', JSON.stringify(twaManifest, null, 2));

    zip.file(
      'capacitor.config.json',
      JSON.stringify(
        {
          appId: packageName,
          appName,
          webDir: 'www',
          server: {
            url: targetUrl,
            cleartext: targetUrl.startsWith('http://'),
          },
          android: {
            backgroundColor: '#090d16',
            allowMixedContent: false,
          },
        },
        null,
        2
      )
    );

    zip.file(
      'android/settings.gradle',
      `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${appName.replace(/"/g, '')}"
include ':app'`
    );

    zip.file(
      'android/build.gradle',
      `plugins {
    id 'com.android.application' version '8.5.2' apply false
}`
    );

    zip.file(
      'android/gradle.properties',
      `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true`
    );

    zip.file(
      'android/app/build.gradle',
      `plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk 35

    defaultConfig {
        applicationId "${packageName}"
        minSdk 23
        targetSdk 35
        versionCode ${versionCode}
        versionName "${versionName}"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.webkit:webkit:1.12.1'
}`
    );

    zip.file('android/app/proguard-rules.pro', '# Keep WebView JS interfaces\n');

    const notificationPerm = enablePush
      ? '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n'
      : '';

    zip.file(
      'android/app/src/main/AndroidManifest.xml',
      `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
${notificationPerm}    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.AssetCrest"
        android:usesCleartextTraffic="${targetUrl.startsWith('http://') ? 'true' : 'false'}">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
    );

    zip.file(
      `android/app/src/main/java/${pkgPath}/MainActivity.java`,
      `package ${packageName};

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final String START_URL = "${targetUrl.replace(/"/g, '\\"')}";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl(START_URL);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }
}`
    );

    zip.file(
      'android/app/src/main/res/values/strings.xml',
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapeXml(appName)}</string>
</resources>`
    );

    zip.file(
      'android/app/src/main/res/values/styles.xml',
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AssetCrest" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:statusBarColor">${themeColor}</item>
        <item name="android:navigationBarColor">#090d16</item>
    </style>
</resources>`
    );

    const publicDir = path.join(process.cwd(), 'public');
    const icon512Path = path.join(publicDir, 'icon-512.png');
    const icon192Path = path.join(publicDir, 'icon-192.png');

    if (fs.existsSync(icon512Path)) {
      zip.file('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', fs.readFileSync(icon512Path));
    }
    if (fs.existsSync(icon192Path)) {
      zip.file('android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', fs.readFileSync(icon192Path));
    }

    zip.file(
      '.github/workflows/build-apk.yml',
      `name: Build Android APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:
jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'
      - name: Build Debug APK
        working-directory: ./android
        run: gradle assembleDebug
      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${packageName}-v${versionName}-debug-apk
          path: android/app/build/outputs/apk/debug/*.apk`
    );

    zip.file(
      'BUILD_APK_INSTRUCTIONS.md',
      `# ${appName} — Android APK Build Bundle
Package ID: \`${packageName}\`
Version: \`${versionName}\` (code \`${versionCode}\`)
Target Web App URL: \`${targetUrl}\`

## Option 1: Instant WebAPK Install (No PC Required)
Open \`${targetUrl}\` in **Google Chrome on Android**, tap **⋮ -> Install App**.
Android Chrome automatically packages the site into a native-running WebAPK on your home screen.

## Option 2: Compile Signed Play Store APK via Bubblewrap (TWA)
Requires Node.js 18+:
\`\`\`bash
npx @bubblewrap/cli init --manifest ${targetUrl.replace(/\/$/, '')}/manifest.json
npx @bubblewrap/cli build
\`\`\`
This outputs \`app-release-signed.apk\` and \`app-release-bundle.aab\`.

## Option 3: Compile Native Android Studio APK
1. Open the \`android/\` folder inside **Android Studio**.
2. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
3. Your installable APK is generated at \`android/app/build/outputs/apk/debug/app-debug.apk\`.

## Option 4: Cloud APK Build via GitHub Actions
Push this extracted folder to a GitHub repository. The included \`.github/workflows/build-apk.yml\` workflow will automatically compile \`app-debug.apk\` in the cloud and let you download it from the **Actions** tab.`
    );

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const slug =
      appName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'assetcrest';

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}-v${versionName}-android-apk-bundle.zip"`
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('APK package generation failed:', error);
    res.status(500).json({ error: 'Failed to generate Android APK project bundle.' });
  }
}
