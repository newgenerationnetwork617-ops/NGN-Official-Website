# New Generation Network — Official Website

This repository contains the public-facing NGN ministry website. It is a conventional multi-page website, separate from the NGN Android application.

## Public pages

- Home
- About NGN
- Teachings (reads published teaching records from Supabase)
- Events & Updates (reads published events and announcements)
- NGN Android App
- Contact

## Administration

Open admin.html and sign in with an existing NGN administrator email and password. The page checks membership in the existing admin_members table; there is no public registration. Administrators can publish teachings and media, devotionals, announcements, and events. Uploads go to the existing public ngn-media bucket, subject to its current storage policies.

The browser uses only the Supabase publishable key. Never add a service-role key or other privileged secret to this public repository.

## Technology

- HTML, CSS, and vanilla JavaScript
- Supabase Auth, database, and Storage
- Firebase Hosting configuration (firebase.json)

## Local preview

Open index.html in a browser, or serve this folder using any local static web server. Supabase-backed pages need an internet connection.

## Firebase deployment

1. Install the Firebase CLI.
2. Sign in to Firebase.
3. Run firebase use --add and select the confirmed NGN Firebase project.
4. Run firebase deploy --only hosting.

The Firebase project alias is intentionally not committed until the correct NGN Firebase project is confirmed.

## Project boundaries

- The website does not imitate the Android app interface.
- The Android APK remains a separate product and is linked from the website.
- The website shares selected published content with the existing NGN backend.
- The website does not replace the APK's offline-first features or mobile-only functionality.
