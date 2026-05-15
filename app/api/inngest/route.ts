import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { 
  // Store functions
  onStoreCreated, 
  onStoreDeleted,
  onUserOnboarded, 
  onCacheInvalidate,
  
  // Product functions
  onProductCreated,
  onProductDeleted,
  
  // Page functions
  onPageCreated,
  onPageUpdated,
  onPagePublished,
  onPageUnpublished,
  onPageDeleted,
  
  // Template functions
  onTemplateCreated,
  onTemplateActivated,
  onTemplateUpdated,
  onTemplateDeleted,
  
  // Popup functions
  onPopupCreated,
  onPopupActivated,
  onPopupDeactivated,
  onPopupUpdated,
  onPopupDeleted,
  
  // Taxonomy functions
  onTagCreated,
  onTagUpdated,
  onTagDeleted,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onBrandCreated,
  onBrandUpdated,
  onBrandDeleted,
  onCollectionCreated,
  onCollectionUpdated,
  onCollectionDeleted,
  
  // Image functions
  onImageUploaded,
  onImageOptimized,
  onImageDeleted,
  onImageFailed,
  
  // Maintenance functions
  archiveAuditLogs,

  // Inventory functions
  onTransferCompleted,
  onTransferCancelled,
  onSaleRecorded,
  onWarehouseCreated,
  onSupplierCreated,

  // Import functions
  onBulkProductImport,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Store functions (3)
    onStoreCreated,
    onStoreDeleted,
    onUserOnboarded,
    
    // Product functions (2)
    onProductCreated,
    onProductDeleted,
    
    // Page functions (5)
    onPageCreated,
    onPageUpdated,
    onPagePublished,
    onPageUnpublished,
    onPageDeleted,
    
    // Template functions (4)
    onTemplateCreated,
    onTemplateActivated,
    onTemplateUpdated,
    onTemplateDeleted,
    
    // Popup functions (5)
    onPopupCreated,
    onPopupActivated,
    onPopupDeactivated,
    onPopupUpdated,
    onPopupDeleted,
    
    // Taxonomy functions (12)
    onTagCreated,
    onTagUpdated,
    onTagDeleted,
    onCategoryCreated,
    onCategoryUpdated,
    onCategoryDeleted,
    onBrandCreated,
    onBrandUpdated,
    onBrandDeleted,
    onCollectionCreated,
    onCollectionUpdated,
    onCollectionDeleted,
    
    // Image functions (4)
    onImageUploaded,
    onImageOptimized,
    onImageDeleted,
    onImageFailed,
    
    // Cache functions (1)
    onCacheInvalidate,
    
    // Maintenance functions (1)
    archiveAuditLogs,

    // Inventory functions (5)
    onTransferCompleted,
    onTransferCancelled,
    onSaleRecorded,
    onWarehouseCreated,
    onSupplierCreated,

    // Import functions (1)
    onBulkProductImport,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
