// Shared liveness flag for the Capture screen. useCamera reads it to discard a
// stream that resolves after the screen unmounted (permission-prompt race).
export const aliveRef = { current: true };
