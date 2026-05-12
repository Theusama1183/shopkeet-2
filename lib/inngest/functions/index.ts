// Export all Inngest functions
export { 
  onStoreCreated, 
  onUserOnboarded, 
  onCacheInvalidate 
} from "./store-functions";

export { 
  onProductCreated,
  onProductDeleted 
} from "./product-functions";

export { 
  onPageCreated,
  onPageUpdated,
  onPagePublished,
  onPageUnpublished,
  onPageDeleted
} from "./page-functions";

export {
  onTemplateCreated,
  onTemplateActivated,
  onTemplateUpdated,
  onTemplateDeleted
} from "./template-functions";

export {
  onPopupCreated,
  onPopupActivated,
  onPopupDeactivated,
  onPopupUpdated,
  onPopupDeleted
} from "./popup-functions";

export {
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
  onCollectionDeleted
} from "./taxonomy-functions";

export {
  onImageUploaded,
  onImageOptimized,
  onImageDeleted,
  onImageFailed
} from "./image-functions";

export { 
  onStoreDeleted 
} from "./cleanup-functions";

export { archiveAuditLogs } from "./maintenance-functions";
