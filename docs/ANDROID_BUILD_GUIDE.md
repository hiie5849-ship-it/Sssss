# Android APK Generation & Signing Guide

ZappKart is designed with a mobile-first responsive architecture and is fully compatible with Android using Capacitor.

---

## Prerequisites

- **Node.js**: v18+
- **Android Studio**: Iguana (2023.2.1) or higher
- **Android SDK**: API Level 33 or 34
- **Java JDK**: OpenJDK 17 or 21

---

## 1. Setup Capacitor in the Project

The repository includes `capacitor.config.json` pre-configured for package ID `com.zappkart.marketplace`.

Install Capacitor dependencies:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## 2. Build the Web App Production Bundle

```bash
npm run build
```
This compiles the optimized React client into the `dist` directory.

---

## 3. Initialize & Sync Android Platform

```bash
npx cap add android
npx cap sync android
```
This creates the native Android Studio project inside the `android/` folder with complete gradle files, AndroidManifest.xml, and web assets synced.

---

## 4. Building Debug APK

To compile and test on a physical Android device or emulator:
```bash
# Open project in Android Studio
npx cap open android
```
Or directly from command line:
```bash
cd android
./gradlew assembleDebug
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Install on connected Android device via ADB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Generating a Signed Release APK / AAB (Google Play Store)

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore zappkart-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias zappkart
   ```
2. Configure `android/key.properties`:
   ```properties
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=zappkart
   storeFile=../zappkart-release-key.jks
   ```
3. Build release bundle:
   ```bash
   cd android
   ./gradlew bundleRelease  # For Google Play AAB
   ./gradlew assembleRelease # For direct Release APK
   ```
4. Output location:
   - APK: `android/app/build/outputs/apk/release/app-release.apk`
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`
