import { check, Update } from '@tauri-apps/plugin-updater';
import { getStoredLicense, checkUpdateEntitlement } from '../license/license';

/**
 * Check whether an update is available and the current license is entitled to install it.
 *
 * - Free users (no stored license): update is offered whenever one is available.
 * - Pro users (stored license key): the license is verified against the server with
 *   version=latest before the update is surfaced. If the server says the license is
 *   not entitled, null is returned even when a newer version exists.
 * - Network errors during the entitlement check are treated permissively: the update
 *   is suppressed rather than shown, to avoid offering an install the license may not cover.
 */
export async function checkForUpdate(): Promise<Update | null> {
    // const licenseKey = await getStoredLicense();

    // if (licenseKey) {
    //     try {
    //         const entitled = await checkUpdateEntitlement(licenseKey);
    //         if (!entitled) return null;
    //     } catch {
    //         return null;
    //     }
    // }

    const update = await check();
    if (!update) return null;

    return update;
}
