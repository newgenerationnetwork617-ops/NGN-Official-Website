# New Generation Network — Official Website

This repository contains the public-facing NGN ministry website. It is a conventional multi-page website, separate from the NGN Android application.

## Public pages

- Home
- About NGN
- Teachings
- Events & Updates
- NGN Android App
- Contact

## Technology

- HTML, CSS, and vanilla JavaScript
- Firebase Hosting configuration (firebase.json)

## Local preview

Open index.html in a browser, or serve this folder using any local static web server.

## Firebase deployment

1. Install the Firebase CLI.
2. Sign in to Firebase.
3. Run firebase use --add and select the confirmed NGN Firebase project.
4. Run firebase deploy --only hosting.

The Firebase project alias is intentionally not committed until the correct NGN Firebase project is confirmed.

## Project boundaries

- The website does not imitate the NGN Android app interface.
- The Android APK remains a separate product and is linked from the website.
- Teaching links currently point to published NGN media already present in the content system.
- Direct live database rendering and the protected administration dashboard are the next integration stages.
