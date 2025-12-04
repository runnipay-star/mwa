
// Dichiarazione globale per la funzione fbq di Facebook
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initMetaPixel = (pixelId: string) => {
  if (!pixelId) return;
  if (window.fbq) return; // Già inizializzato

  console.log(`📡 Inizializzazione Meta Pixel: ${pixelId}`);

  /* eslint-disable */
  (function(f:any, b:any, e:any, v:any, n?:any, t?:any, s?:any){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', pixelId);
};

export const trackPageView = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

export const trackEvent = (eventName: string, data: object = {}) => {
  if (typeof window.fbq === 'function') {
    console.log(`📡 Meta Pixel Event: ${eventName}`, data);
    window.fbq('track', eventName, data);
  }
};

// Eventi Standard
export const trackAddToCart = (contentIds: string[], value: number, currency = 'EUR') => {
  trackEvent('AddToCart', {
    content_ids: contentIds,
    content_type: 'product',
    value: value,
    currency: currency
  });
};

export const trackInitiateCheckout = (contentIds: string[], value: number, currency = 'EUR') => {
  trackEvent('InitiateCheckout', {
    content_ids: contentIds,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: contentIds.length
  });
};

export const trackCompleteRegistration = () => {
  trackEvent('CompleteRegistration', {
    status: 'success'
  });
};
