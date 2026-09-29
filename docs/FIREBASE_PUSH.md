# Android Firebase push

Firebase project `vault-c572d` and Android package `com.pranjal.vault` are retained. `google-services.json` remains referenced by `expo.android.googleServicesFile`; native Google Services Gradle configuration remains intact. The existing external service-account file and EAS-assigned FCM credentials have not been removed or rotated.

Android now registers its native FCM token via `getDevicePushTokenAsync`, and the Node backend sends using Firebase Admin directly. `expo-notifications` remains responsible for permission requests, the `vault_automatic` channel, foreground display and response listeners, and cold-start tap handling. The backend includes a notification payload for OS display while the app is in the background or terminated, with generic lock-screen content and owner-scoped inbox data.

Previously opted-in devices migrate when the updated app opens/resumes; their old registration is disabled after a replacement registers successfully. Existing Expo tokens remain supported during migration, and iOS keeps its existing Expo/APNs path. Firebase tokens are kept in MongoDB; SecureStore keeps only the device record ID and account ID.

See [backend setup and verification](../../Backend/NOTIFICATIONS.md) for cron, Firebase Admin secrets and deployment steps. Install the updated app before expecting direct FCM registration. The previously staged APK is not rebuilt by these source changes.

Verified locally: matching Firebase project IDs, backend credential authentication, native Google Services configuration, existing merged manifest notification permission/messaging service, and notification tests. No Android device was attached: real background/terminated delivery and tap routing still require device testing. OS force-stop is distinct from ordinary app termination and can block delivery until the app is reopened.

Reference: [Expo direct FCM/native token documentation](https://docs.expo.dev/push-notifications/sending-notifications-custom/).
