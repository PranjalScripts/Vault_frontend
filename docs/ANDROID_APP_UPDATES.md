# Android APK updates

Vault checks `GET /api/app-update` at native app startup and when Android returns to the foreground, with a six hour throttle. The endpoint is public and independent of MongoDB. It responds with `Cache-Control: no-store` and JSON like:

```json
{
  "success": true,
  "latestVersion": "1.2.0",
  "latestVersionCode": 12,
  "minimumSupportedVersionCode": 0,
  "apkUrl": "https://github.com/OWNER/REPOSITORY/releases/download/v1.2.0/vault.apk",
  "releaseNotes": "Security and stability improvements.",
  "mandatory": false
}
```

## Local Gradle release workflow

The local release build is `./gradlew assembleRelease` from `Frontend/android`. The output is `Frontend/android/app/build/outputs/apk/release/app-release.apk`. Gradle reads `versionCode` and `versionName` directly from `android/app/build.gradle`; it does not auto-increment them. Keep these values synchronized with `expo.android.versionCode` and `expo.version` in `app.json`.

The existing local release configuration signs with `signingConfigs.debug` and `android/app/debug.keystore`. Keep that exact keystore and certificate for upgrade compatibility. Do not run `expo prebuild` as a release step unless you first preserve and verify the native signing configuration; this Android directory is locally generated/ignored by Git.

1. Increment both version fields before each release; this workspace's next build is configured as version `1.0.1`, versionCode `2`, based on the existing local release APK (`1.0.0`, code `1`).
2. Build locally with `cd Frontend/android && ./gradlew assembleRelease`.
3. Upload the APK as a GitHub Release asset (never commit the APK). The current `PranjalScripts/Vault_frontend` repository is private, so its release assets cannot serve anonymous app downloads. Use a public GitHub repository selected for releases, or another public HTTPS host. Use the actual direct asset URL, not the illustrative placeholder in the example response above.
4. After the release is approved and the asset is publicly accessible, set these backend Vercel Production environment variables and redeploy the Backend project:
   - `VAULT_UPDATE_LATEST_VERSION`: human version, such as `1.2.0`.
   - `VAULT_UPDATE_LATEST_VERSION_CODE`: integer versionCode from that APK.
   - `VAULT_UPDATE_MINIMUM_VERSION_CODE`: integer minimum supported code, or `0` to disable minimum enforcement.
   - `VAULT_UPDATE_APK_URL`: direct HTTPS URL to the public APK asset.
   - `VAULT_UPDATE_RELEASE_NOTES`: short plain text shown in the app.
   - `VAULT_UPDATE_MANDATORY`: `true` or `false` (defaults are intentionally not inferred; configure it explicitly for each release).

The endpoint returns HTTP 503 with a generic unavailable response until valid metadata is configured; the app then continues normally and retries on a later foreground check. Release version codes must be greater than the installed code. Do not publish `mandatory=true` until the new asset is available. No production metadata is configured by this implementation.

No new frontend environment variable is needed. Keep the existing `EXPO_PUBLIC_API_URL` configured in the EAS build environment to point at the deployed backend API.

The app verifies the HTTPS URL, metadata shape, successful HTTP 200 download response, non-HTML/non-JSON content, and a non-empty APK file of plausible size before launching Android's installer. Large APK hashing is not implemented; publish only trusted release assets and restrict who can replace them.

When an update prompt appears, **Download in background** downloads the APK with Expo's background-capable file download while Vault is minimized, shows progress in Vault when it is open, and posts a local notification when the APK is ready. Tapping **Install update** still opens Android's installer, which requires user confirmation. Grant Vault notification permission to receive the completion notification. Android battery policies or force-stopping Vault can interrupt background work; this option does not guarantee download continuation after the operating system terminates the app.

## Signing and installation

Keep Android application ID `com.pranjal.vault` and the existing EAS remote signing credential. Android accepts an update only when its signing certificate matches the installed build. Do not replace the EAS credential. The committed native Gradle release configuration currently names the debug signing config; use the existing EAS remote signing setup for distributable builds, and verify EAS credentials in the account before releasing. This implementation does not modify signing configuration or generate keys.

The APK is saved in the app cache and shared with Android through Expo FileSystem's content URI. `REQUEST_INSTALL_PACKAGES` is declared in app config and the local native manifest. Android may ask the user to allow Vault to install apps from this source in system settings, and always requires confirmation of the package installation. Vault does not install silently. Updates retain the app ID and do not clear app data.

The existing EAS profiles are not part of this release workflow. Changes to the native permission and added Expo native modules require a new local Gradle APK build; no Expo OTA update infrastructure is used.
