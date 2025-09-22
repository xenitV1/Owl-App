export const pageview = (url: string) => {
  if (typeof window === 'undefined') return;
  // @ts-ignore
  window.gtag?.('event', 'page_view', {
    page_location: url,
  });
};


