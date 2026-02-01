export type TrackingEventType =
  // Page views
  | "homepage_view"
  | "settings_view"
  | "recipes_view"
  | "extract_view"
  | "recipe_detail_view"
  | "recipe_edit_view"
  | "terms_view"
  | "privacy_view"
  | "login_view"
  | "register_view"
  // Homepage interactions
  | "homepage_cta_click"
  // Header interactions
  | "header_logo_click"
  | "header_dropdown_open"
  | "header_mobile_menu_toggle"
  // Recipe interactions
  | "recipe_card_click"
  | "similar_recipe_click"
  | "filter_applied"
  | "sort_applied"
  | "filters_cleared"
  | "recipe_search"
  | "recipe_deleted"
  // Collection interactions
  | "collection_selected"
  | "collection_created"
  | "collection_deleted"
  | "recipe_added_to_collection"
  | "recipe_removed_from_collection"
  // Tag interactions
  | "tag_created"
  | "tag_deleted"
  | "tag_added_to_recipe"
  | "tag_removed_from_recipe"
  // Upgrade prompts
  | "upgrade_prompt_shown"
  | "upgrade_prompt_dismissed"
  | "upgrade_prompt_cta_click"
  // Extraction
  | "extraction_attempt"
  | "extraction_success"
  | "extraction_error"
  // Recipe editing
  | "recipe_edited"
  // Billing
  | "plan_card_click"
  | "subscribe_click"
  // Telegram
  | "telegram_connect_click"
  | "telegram_disconnect_click"
  // Auth
  | "login_attempt"
  | "register_attempt";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface TrackingDocument {
  type: TrackingEventType;
  timestamp: Date;
  deviceId: string;
  deviceType: DeviceType;
  userId?: string;
  country?: string;
  region?: string;
  metadata?: Record<string, unknown>;
}
