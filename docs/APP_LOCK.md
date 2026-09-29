# Mobile app lock

Settings → Fingerprint & device lock enables an optional, device-wide gate. Confirm OS authentication to enable or disable it. It starts locked on cold launch and locks when the app becomes inactive or goes into the background. Tap Unlock Vault to use the system prompt. Cancelled or failed authentication leaves the gate closed; it does not log out the account.

The OS handles enrolled fingerprints/Face ID and device PIN, pattern, or passcode fallback. Android requests strong biometrics. Configure a phone screen lock first. Vault does not receive or store biometric data or the phone passcode. The opt-in flag lives in Expo SecureStore on this device. The existing vault encryption password and account login remain separate. This is a UI access gate, not a replacement for encryption or protection on a compromised device.

Rebuild/install the native app after adding `expo-local-authentication`; an OTA JavaScript update alone cannot add a missing native module. Android permissions are merged from the library manifest. The Expo plugin configures the Face ID permission for generated iOS builds. Face ID requires a development/production build rather than Expo Go. See [Expo LocalAuthentication documentation](https://docs.expo.dev/versions/v54.0.0/sdk/local-authentication/).

Run `node --test tests/appLock.test.cjs`. Before release, verify on real Android/iOS hardware: enable/disable verification, fingerprint success/failure, device-credential fallback, cancellation, cold launch, background/foreground with an open modal, notification/deep-link entry, and removal of enrolled biometrics. No physical-device verification was available during implementation. Native app-switcher snapshot privacy is not guaranteed by this JavaScript gate.
