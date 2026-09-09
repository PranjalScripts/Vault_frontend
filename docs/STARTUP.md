# Mobile startup / splash

The only splash is the native `expo-splash-screen` launch screen. Its unchanged
source is `assets/images/icon.png` (1254 × 1254). No React logo, spinner, artificial
minimum duration, new image asset or additional dependency is used.

## Configuration and visual limits

- Cream `#FBFAF4` matches the cream in the supplied artwork.
- `contain` preserves the complete image's aspect ratio.
- iOS uses a centered 320-point image, generated at 1x/2x/3x.
- Android uses 200 dp within Expo's 288 dp native splash canvas. The actual
  lettering/mark fits the Android 12+ 192 dp circular safe area. Arbitrarily
  increasing this value clips the slogan or wordmark under the system mask.
- Android light/night variants use the same cream and image. iOS follows the
  app's existing fixed light appearance, without a conflicting dark override.
- Launcher icon/adaptive-icon configuration is unchanged.

The source has a baked-in rounded tile, shadow and white outer corners. A flat
native background cannot remove these pixels or create the reference's bottom
waves. This change preserves that supplied artwork rather than redrawing it.
Android's single-color, system-sized launch screen cannot reproduce a full-screen
poster composition. iOS permits a larger centered branding group.

## Why the old sequence flashed

Git's earlier config used `#208AEF`, `splash-icon.png` and imageWidth 76. Those
values remain inside already-built old binaries until they are rebuilt. The
working tree had already changed to cream and commented out VaultSplash, but
`_layout.tsx` still hid the native splash in an unconditional mount effect with a
comment about replacing it with a React splash. That hides before token checking
and the auth redirect finish; adding a React logo there creates a second splash.

The obsolete mount-time hide, custom-splash comments and commented 900 ms delay
are removed. There was no active VaultSplash component/file left to delete.

## Final sequence

1. The operating system shows the native cream Vault splash.
2. JS calls `preventAutoHideAsync` at module scope before mounting.
3. ThemeProvider, VaultProvider, StatusBar, the existing Stack and Toast mount
   underneath; `getAuthToken` and its existing auth subscription remain intact.
4. The existing route rules resolve: authenticated `/` goes to `/dashboard`;
   unauthenticated protected destinations go to `/`; permitted deep links stay.
5. Once auth is ready, root navigation is mounted, the root view has laid out,
   and no redirect remains pending, two animation frames allow the destination
   to commit under the splash. Initial redirect animation is disabled.
6. `hideAsync` removes the native splash (200 ms native crossfade on iOS), exposing
   the destination. Ordinary route animation resumes. No second branded screen.

The native splash does not wait for remote dashboard/vault data to download.
Those screens keep their existing behavior. No backend/auth/API screen redesign
is included.

## Rebuild existing local projects

```sh
cd /Users/Vault/Frontend
node scripts/sync-native-splash.cjs
npx expo run:android --variant release --device
```

On a Mac with Xcode and an iOS device/simulator configured:

```sh
cd /Users/Vault/Frontend
node scripts/sync-native-splash.cjs
npx expo run:ios --configuration Release --device
```

The sync script runs only the installed Expo splash config plugin against existing
native projects. It does not regenerate launcher icons or run unrelated plugins.
Native folders are gitignored; the committed source of truth is app.json. On a
fresh checkout without android/ios folders, first run `npx expo prebuild` (normal
native setup/signing requirements apply). EAS also runs prebuild when folders are
absent; `npx eas-cli build --platform android --profile preview` builds an internal
Android binary using the existing profile.

`expo start` / Fast Refresh / OTA updates cannot replace native launch resources.
Expo Go and development-client launch screens are not release splash previews.

## Device check

Install the rebuilt binary and launch from its home-screen icon, not Metro.
Cold-start with a saved login, then without one; check a protected deep link with
and without login. Test Android 12+ and iOS, system light and dark, and a small
screen. Verify one logo, no intermediate login/blank screen for a saved login,
correct destination, and no clipped slogan. Do not add a test delay to production.

You normally do not need to uninstall: reinstall over the same package ID with
the same signing key. Existing old binaries (especially an old
`com.pranjal.frontend` app alongside `com.pranjal.vault`) are separate installations;
make sure you launch Vault. Only uninstall for a signing conflict or persistent
OS launch-screen cache after a rebuilt reinstall; uninstalling clears local data.

## Verification in this workspace

The splash-only native sync completed for Android/iOS. Generated asset dimensions,
centered iOS aspect-fit storyboard, cream native colors, absence of old blue
startup references and unchanged source-logo checksum were checked. Splash-related
lint passes. Full TypeScript checking currently reports the pre-existing removed
`/explore` route reference in `src/components/app-tabs.web.tsx`. No connected Android
device was available for a release cold-start recording.

References:
- https://docs.expo.dev/versions/v54.0.0/sdk/splash-screen/
- https://developer.android.com/develop/ui/views/launch/splash-screen
