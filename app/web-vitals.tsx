'use client';

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS((metric: any) => {
          console.log('CLS:', metric);
        });
        
        onINP((metric: any) => {
          console.log('INP:', metric);
        });
        
        onFCP((metric: any) => {
          console.log('FCP:', metric);
        });
        
        onLCP((metric: any) => {
          console.log('LCP:', metric);
        });
        
        onTTFB((metric: any) => {
          console.log('TTFB:', metric);
        });
      });
    }
  }, []);

  return null;
}