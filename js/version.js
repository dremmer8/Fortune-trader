// Version string for the deployed build.
// Update this value manually when a new iteration is created/pushed to the repository.
const APP_VERSION = 'v0.019';

if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
    window.dispatchEvent(new CustomEvent('app-version-ready', { detail: { version: APP_VERSION } }));
}
