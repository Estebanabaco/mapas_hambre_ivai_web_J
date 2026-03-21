const listeners = new Map();

export function on(eventName, handler) {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(handler);
    return () => off(eventName, handler);
}

export function off(eventName, handler) {
    const set = listeners.get(eventName);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
        listeners.delete(eventName);
    }
}

export function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set) return;
    set.forEach((handler) => {
        try {
            handler(payload);
        } catch (error) {
            console.error(`Event handler error for ${eventName}:`, error);
        }
    });
}
