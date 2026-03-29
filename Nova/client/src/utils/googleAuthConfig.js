const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const allowedOrigins = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const currentOrigin = window.location.origin;

const isCurrentOriginAllowed =
    allowedOrigins.length === 0 || allowedOrigins.includes(currentOrigin);

const googleAuthDisableReason = !googleClientId
    ? 'missing-client-id'
    : !isCurrentOriginAllowed
        ? 'origin-not-allowed'
        : '';

const isGoogleAuthEnabled = Boolean(googleClientId) && isCurrentOriginAllowed;

export {
    allowedOrigins,
    currentOrigin,
    googleAuthDisableReason,
    googleClientId,
    isCurrentOriginAllowed,
    isGoogleAuthEnabled
};