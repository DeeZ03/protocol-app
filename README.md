# Protocol

Protocol is an early-stage React Native + Expo prototype for Android and iOS.

## Status

**v0.1 — navigation prototype.** The five tabs are Dashboard, Protocols, Health, Library and Community. No backend, authentication, medical calculations or real health data are implemented yet.

## Start in GitHub Codespaces

1. Open this repository in a Codespace.
2. In its terminal, run `npm install`.
3. Run `npx expo start --tunnel` to start Expo. (Tunnel mode may prompt for `@expo/ngrok`.)
4. Scan the QR code using Expo Go on an Android phone. Browser-hosted Codespaces may need tunnel mode for phone access.

## Build an Android APK

1. Create an account at https://expo.dev/.
2. Run `npx eas-cli login` and `npx eas-cli build:configure` if prompted.
3. Run `npx eas-cli build --platform android --profile preview`.
4. Follow the Expo build URL and install the resulting APK on your Android phone.

Cloud builds require an Expo account and may have usage limits. iOS builds require separate Apple signing/distribution arrangements.

## Safety and privacy

This prototype is for UI testing only. Do not enter personal medical information. Do not use it for treatment or dosing decisions. Before production, implement secure authentication, access controls, privacy safeguards, tests and professional review.
