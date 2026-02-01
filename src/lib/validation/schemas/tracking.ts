import { z } from "zod";

const trackingEventTypes = [
  "homepage_view",
  "settings_view",
  "recipes_view",
  "extract_view",
  "recipe_detail_view",
  "recipe_edit_view",
  "terms_view",
  "privacy_view",
  "login_view",
  "register_view",
  "homepage_cta_click",
  "header_logo_click",
  "header_dropdown_open",
  "header_mobile_menu_toggle",
  "recipe_card_click",
  "similar_recipe_click",
  "filter_applied",
  "sort_applied",
  "filters_cleared",
  "recipe_search",
  "recipe_deleted",
  "extraction_attempt",
  "extraction_success",
  "extraction_error",
  "recipe_edited",
  "plan_card_click",
  "subscribe_click",
  "telegram_connect_click",
  "telegram_disconnect_click",
  "login_attempt",
  "register_attempt",
] as const;

export const trackingBodySchema = z.object({
  type: z.enum(trackingEventTypes),
  deviceId: z.string().min(1, "deviceId is required"),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TrackingBody = z.infer<typeof trackingBodySchema>;
