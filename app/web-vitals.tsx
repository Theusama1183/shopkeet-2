'use client';

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          console.log('CLS:', metric);
          // Send to analytics service
        });
        
        getFID((metric) => {
          console.log('FID:', metric);
          // Send to analytics service
        });
        
        getFCP((metric) => {
          console.log('FCP:', metric);
          // Send to analytics service
        });
        
        getLCP((metric) => {
          console.log('LCP:', metric);
          // Send to analytics service
        });
        
        getTTFB((metric) => {
          console.log('TTFB:', metric);
          // Send to analytics service
        });
      });
    }
  }, []);

  return null;
}