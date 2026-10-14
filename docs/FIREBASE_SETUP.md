# Firebase Integration & Deployment Guide

This guide details how to link ZappKart with a Google Firebase project for Cloud Firestore, Firebase Authentication, and Cloud Functions.

---

## 1. Create a Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter `zappkart-marketplace` (or your preferred name).
3. Enable or disable Google Analytics depending on preference, then click **Create project**.

---

## 2. Configure Firebase Authentication

1. In the Firebase console left sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Enable **Google** provider (recommended for OAuth single sign-on).
   - Enable **Email/Password** provider (ensure email verification is enabled for production).
4. In **Settings > Authorized domains**, add your deployment domains:
   - `localhost`
   - Your custom marketplace domain (e.g., `marketplace.zappkart.com`).

---

## 3. Provision Cloud Firestore Database

1. In the Firebase console, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose your database location (e.g., `asia-south1` for India or closest region to your user base).
4. Start in **Production mode** (which denies default access).
5. Open the **Rules** tab in Firestore:
   - Copy the contents of `firestore.rules` provided in this repository.
   - Click **Publish**.

---

## 4. Setup Firebase Web App Configuration

1. In Project Overview, click the Web icon `</>` to register a web application.
2. Enter App nickname: `ZappKart Web Client`.
3. Copy the configuration object and save it into `firebase-applet-config.json` in your project root:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "zappkart-prod.firebaseapp.com",
     "projectId": "zappkart-prod",
     "storageBucket": "zappkart-prod.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abcdef"
   }
   ```

---

## 5. Deploying Firestore Security Rules with Firebase CLI

If using the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select firestore.rules and firestore.indexes.json
firebase deploy --only firestore:rules
```

---

## 6. Seed Super Administrator

To bootstrap the initial administrator in Firestore:
Create a document in the `/admins` collection with the administrator's Firebase User ID (UID):
```bash
/admins/{SUPER_ADMIN_UID}
{
  "email": "admin@zappkart.com",
  "role": "admin",
  "createdAt": "2026-10-14T00:00:00Z"
}
```
This grants mathematical ABAC rule access across the entire multi-vendor schema.
