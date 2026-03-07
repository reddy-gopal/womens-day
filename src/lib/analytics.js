const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function trackEvent(eventType) {
    if (!URL || !KEY) return;
    try {
        await fetch(`${URL}/rest/v1/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': KEY,
                'Authorization': `Bearer ${KEY}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ event_type: eventType }),
        });
    } catch {
        // silently ignore failing analytics
    }
}
