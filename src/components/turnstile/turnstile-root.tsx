"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileRoot() {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return null;

    // Render an invisible/injected Turnstile widget so the script is available globally.
    return (
        <div aria-hidden>
            <Turnstile
                siteKey={siteKey}
                injectScript
                options={{ theme: "dark", size: "invisible", action: "global" }}
            />
        </div>
    );
}
