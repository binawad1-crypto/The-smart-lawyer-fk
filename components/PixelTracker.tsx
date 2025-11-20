import React, { useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

declare global {
  interface Window {
    fbq: any;
    snaptr: any;
    ttq: any;
    gtag: any;
    dataLayer: any[];
  }
}

const PixelTracker: React.FC = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings?.adPixels) return;
    const { googleTagId, facebookPixelId, snapchatPixelId, tiktokPixelId } = settings.adPixels;

    // --- Google Tag (gtag.js) ---
    if (googleTagId && !document.getElementById('google-gtag')) {
      const script = document.createElement('script');
      script.id = 'google-gtag';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleTagId}');
      `;
      document.head.appendChild(inlineScript);
    }

    // --- Facebook Pixel ---
    if (facebookPixelId && !document.getElementById('facebook-pixel')) {
      const script = document.createElement('script');
      script.id = 'facebook-pixel';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    // --- Snapchat Pixel ---
    if (snapchatPixelId && !document.getElementById('snapchat-pixel')) {
        const script = document.createElement('script');
        script.id = 'snapchat-pixel';
        script.innerHTML = `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
        {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');
        snaptr('init', '${snapchatPixelId}', {
        'user_email': '__INSERT_USER_EMAIL__'
        });
        snaptr('track', 'PAGE_VIEW');
        `;
        document.head.appendChild(script);
    }

    // --- TikTok Pixel ---
    // FIX: Updated to a more robust script injection method to ensure proper execution.
    // It checks if the TikTok object (ttq) already exists to prevent re-initialization.
    if (tiktokPixelId && !window.ttq) {
      const script = document.createElement('script');
      script.id = 'tiktok-pixel';
      script.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        
          ttq.load('${tiktokPixelId}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(script);
    }

  }, [settings]);

  return null; // This component does not render anything visible
};

export default PixelTracker;