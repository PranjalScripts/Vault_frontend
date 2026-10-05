# Android shared links

Set `EXPO_PUBLIC_WEB_URL` to the actual public HTTPS website origin in both Android and web builds. HTTP development origins do not register verified App Links.

Rebuild native configuration with `npx expo prebuild --platform android`, then build/install a new release APK. Existing installations need this update before HTTPS links can open automatically. Expo Router handles `/share?token=…`, `/puzzles/:id`, and legacy `/games/puzzles/:id` directly. Puzzle detail links remain public; the `/puzzles` catalog requires sign-in.

Deploy `public/.well-known/assetlinks.json` at the same website origin. It must return JSON over HTTPS without redirects. Its SHA-256 certificate fingerprint was read from the existing `android/app/build/outputs/apk/release/app-release.apk`. That APK currently uses the Android debug signing certificate. When changing signing keys or distributing through Play App Signing, replace/add the actual distribution certificate fingerprint.

For downloads, set `EXPO_PUBLIC_ANDROID_DOWNLOAD_URL` to the hosted release APK URL. Alternatively copy the rebuilt APK to `public/downloads/vault.apk` before the web export/deployment. APKs are ignored by git; a Git-only deployment must supply the hosted URL or stage the binary in its build pipeline. The existing local release APK has been staged there for local use, but needs replacing after the App Links rebuild.

On Android browsers, shared pages offer Open in app (also works with existing `vault://` installations), Download Android app, and Continue in browser. The open button uses an Android intent with the original HTTPS content as its browser fallback. No timed forced redirect or installation detection is needed. Browsers embedded in other apps may require opening in the system browser.

Verification after deployment and installation:

```
adb shell pm verify-app-links --re-verify com.pranjal.vault
adb shell pm get-app-links com.pranjal.vault
adb shell am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'https://YOUR_DOMAIN/share?token=VALID_TOKEN'
```

Check both a cold launch and an already-open app, puzzle links, signed-out viewing, a phone without Vault (browser content remains available), and the download link. iOS Universal Links require a separate Apple team association and are not configured here.

Reference: https://docs.expo.dev/linking/android-app-links/
