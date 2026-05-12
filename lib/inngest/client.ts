import { Inngest } from "inngest";

// Create a client to send and receive events
// In development, event key is optional (uses dev server)
// In production, event key is required
export const inngest = new Inngest({ 
  id: "shopkeet",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types for type safety
export type Events = {
  "store/created": {
    data: {
      storeId: string;
      userId: string;
      subdomain: string;
    };
  };
  "store/updated": {
    data: {
      storeId: string;
      changes: Record<string, unknown>;
    };
  };
  "store/deleted": {
    data: {
      storeId: string;
      userId: string;
      subdomain: string;
    };
  };
  "product/created": {
    data: {
      productId: string;
      storeId: string;
      imageUrl?: string;
    };
  };
  "product/updated": {
    data: {
      productId: string;
      storeId: string;
      changes: string[];
    };
  };
  "product/deleted": {
    data: {
      productId: string;
      storeId: string;
    };
  };
  "page/published": {
    data: {
      pageId: string;
      storeId: string;
      slug: string;
    };
  };
  "user/onboarded": {
    data: {
      userId: string;
      email: string;
      storeId: string;
    };
  };
  "cache/invalidate": {
    data: {
      keys?: string[];
      storeId?: string;
      subdomain?: string;
      tags?: string[];
    };
  };
  "image/uploaded": {
    data: {
      url: string;
      storeId: string;
      type: string;
      size: number;
    };
  };
};
