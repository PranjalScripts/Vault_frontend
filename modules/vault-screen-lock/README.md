# Vault screen lock signal

This local Expo module is autolinked from `modules/`. Rebuild the native app after adding or changing it; an OTA JavaScript update alone cannot install it. Builds without this module keep the previous immediate background lock as a safe fallback.

Android records screen-off broadcasts and checks the device keyguard when the activity pauses. The native counter survives JavaScript suspension, so returning after a screen-off cannot reuse the two-minute app-switch grace period. The JavaScript controller also locks on cold start and when returning after two minutes away, and obscures app content in the background.

iOS uses the public protected-data-unavailable notification. Its timing is controlled by iOS and is not an exact screen-off signal. Verify lock/unlock behavior on a physical iPhone; Android screen-off behavior must likewise be checked on a physical phone.

Manual checks with app lock enabled:

1. Unlock Vault, switch apps for less than two minutes, and return: no new authentication prompt.
2. Switch apps for at least two minutes: Vault requires authentication on return.
3. On Android, turn the screen off and on during a brief switch: Vault requires authentication.
4. Kill and reopen the app: authentication is required.
5. Cancel authentication or lock the phone while it is pending: the app remains locked.
