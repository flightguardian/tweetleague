'use client';

import { useEffect } from 'react';

export function TawkChat() {
  useEffect(() => {
    // Check if Tawk.to is enabled via environment variable
    const tawkEnabled = process.env.NEXT_PUBLIC_TAWK_TO_ENABLED === 'TRUE';
    
    if (!tawkEnabled) {
      return; // Don't load Tawk.to if not enabled
    }

    // Only load Tawk.to on the client side
    const loadTawk = () => {
      // @ts-ignore
      window.Tawk_API = window.Tawk_API || {};
      // @ts-ignore
      window.Tawk_LoadStart = new Date();
      
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://embed.tawk.to/68971b9a2f0f7c192611aee9/1j2747lp0';
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(loadTawk, 100);

    return () => {
      clearTimeout(timer);
      // Clean up if needed
      const tawkScript = document.querySelector('script[src*="tawk.to"]');
      if (tawkScript) {
        tawkScript.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}