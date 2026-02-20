/**
 * Kakao Channel Plugin Type Definitions
 *
 * Simplified: Single channel + Relay mode only
 *
 * Reference:
 * - Kakao SkillPayload/Response: docs/relay-server-api-spec.md
 */

// ============================================================================
// Kakao SkillPayload Types
// ============================================================================

export interface KakaoIntent {
  id: string;
  name: string;
  extra?: {
    knowledges?: KakaoKnowledge[];
  };
}

export interface KakaoKnowledge {
  answer: string;
  question: string;
  categories?: string[];
  landingUrl?: string;
  imageUrl?: string;
}

export interface KakaoUser {
  id: string;
  type: "botUserKey";
  properties: {
    plusfriendUserKey?: string;
    appUserId?: string;
    isFriend?: boolean;
  };
}

export interface KakaoBlock {
  id: string;
  name: string;
}

export interface KakaoUserRequest {
  timezone: string;
  utterance: string;
  lang: string;
  user: KakaoUser;
  block?: KakaoBlock;
  callbackUrl?: string;
}

export interface KakaoBot {
  id: string;
  name: string;
}

export interface KakaoDetailParam {
  origin: string;
  value: string;
  groupName?: string;
}

export interface KakaoAction {
  id: string;
  name: string;
  params: Record<string, string>;
  detailParams: Record<string, KakaoDetailParam>;
  clientExtra: Record<string, unknown>;
}

export interface KakaoSkillPayload {
  intent: KakaoIntent;
  userRequest: KakaoUserRequest;
  bot: KakaoBot;
  action: KakaoAction;
}

// ============================================================================
// Kakao SkillResponse Types (v2.0)
// ============================================================================

export interface KakaoSimpleText {
  simpleText: {
    text: string;
  };
}

export interface KakaoSimpleImage {
  simpleImage: {
    imageUrl: string;
    altText?: string;
  };
}

export interface KakaoLink {
  web?: string;
  mobile?: string;
  pc?: string;
}

export interface KakaoThumbnail {
  imageUrl: string;
  altText?: string;
  width?: number;
  height?: number;
  link?: KakaoLink;
  fixedRatio?: boolean;
}

export interface KakaoOsLink {
  ios?: string;
  android?: string;
}

export interface KakaoButton {
  label: string;
  action: "webLink" | "message" | "block" | "share" | "phone" | "operator" | "osLink";
  webLinkUrl?: string;
  messageText?: string;
  blockId?: string;
  phoneNumber?: string;
  osLink?: KakaoOsLink;
  extra?: Record<string, unknown>;
}

export interface KakaoTextCard {
  textCard: {
    title?: string;
    description?: string;
    buttons?: KakaoButton[];
    buttonLayout?: "horizontal" | "vertical";
  };
}

export interface KakaoBasicCard {
  basicCard: {
    title?: string;
    description?: string;
    thumbnail: KakaoThumbnail;
    buttons?: KakaoButton[];
    buttonLayout?: "horizontal" | "vertical";
  };
}

export interface KakaoProfile {
  imageUrl?: string;
  width?: number;
  height?: number;
  title?: string;
  nickname?: string;
}

export interface KakaoCommerceCard {
  commerceCard: {
    title?: string;
    description?: string;
    price: number;
    currency?: "won";
    discount?: number;
    discountRate?: number;
    discountedPrice?: number;
    thumbnails: KakaoThumbnail[];
    profile?: KakaoProfile;
    buttons?: KakaoButton[];
    buttonLayout?: "horizontal" | "vertical";
  };
}

export interface KakaoListItem {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: KakaoLink;
  action?: "block" | "message";
  blockId?: string;
  messageText?: string;
  extra?: Record<string, unknown>;
}

export interface KakaoListCard {
  listCard: {
    header: KakaoListItem;
    items: KakaoListItem[];
    buttons?: KakaoButton[];
    buttonLayout?: "horizontal" | "vertical";
  };
}

export interface KakaoHead {
  title: string;
}

export interface KakaoImageTitle {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface KakaoItemListItem {
  title: string;
  description?: string;
}

export interface KakaoItemListSummary {
  title: string;
  description?: string;
}

export interface KakaoItemCard {
  itemCard: {
    thumbnail?: KakaoThumbnail;
    head?: KakaoHead;
    profile?: KakaoProfile;
    imageTitle?: KakaoImageTitle;
    itemList: KakaoItemListItem[];
    itemListAlignment?: "left" | "right";
    itemListSummary?: KakaoItemListSummary;
    title?: string;
    description?: string;
    buttons?: KakaoButton[];
    buttonLayout?: "horizontal" | "vertical";
  };
}

export interface KakaoCarousel {
  carousel: {
    type: "basicCard" | "commerceCard" | "itemCard" | "textCard";
    items: (
      | KakaoBasicCard["basicCard"]
      | KakaoCommerceCard["commerceCard"]
      | KakaoItemCard["itemCard"]
      | KakaoTextCard["textCard"]
    )[];
  };
}

export type KakaoOutput =
  | KakaoSimpleText
  | KakaoSimpleImage
  | KakaoTextCard
  | KakaoBasicCard
  | KakaoCommerceCard
  | KakaoListCard
  | KakaoItemCard
  | KakaoCarousel;

export interface KakaoQuickReply {
  label: string;
  action: "message" | "block";
  messageText?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}

export interface KakaoContextValue {
  name: string;
  lifeSpan: number;
  ttl?: number;
  params?: Record<string, string>;
}

export interface KakaoContextControl {
  values: KakaoContextValue[];
}

export interface KakaoSkillTemplate {
  outputs: KakaoOutput[];
  quickReplies?: KakaoQuickReply[];
}

export interface KakaoSkillResponse {
  version: "2.0";
  useCallback?: boolean;
  template?: KakaoSkillTemplate;
  context?: KakaoContextControl;
  data?: Record<string, unknown>;
}

// ============================================================================
// Plugin Configuration Types (Simplified: Relay mode only)
// ============================================================================

// 계정 설정 타입은 Zod 스키마에서 추론 (src/config/schema.ts)
import type { KakaoAccountConfig } from "./config/schema.js";

export interface ResolvedKakaoTalkChannel {
  talkchannelId: string; // Always "default" for single channel (kept for future extensibility)
  config: KakaoAccountConfig;
  enabled: boolean;
  name?: string;
  channelId?: string; // Optional (from config)
  tokenSource?: "config" | "env" | "session" | "none";
}

// ============================================================================
// Relay Server Types
// ============================================================================

export interface InboundMessage {
  id: string;
  conversationKey: string;
  kakaoPayload?: KakaoSkillPayload; // Optional: raw Kakao payload
  normalized: {
    userId: string;
    text: string;
    channelId: string;
  };
  createdAt: string; // ISO 8601
}

export type SSEEventType = "message" | "ping" | "error" | "pairing_complete" | "pairing_expired";

export interface SSEMessageEvent {
  event: "message";
  data: InboundMessage;
  id?: string;
}

export interface SSEPingEvent {
  event: "ping";
  data: Record<string, never>;
  id?: string;
}

export interface SSEErrorEvent {
  event: "error";
  data: {
    code: string;
    message: string;
  };
  id?: string;
}

export interface SSEPairingCompleteEvent {
  event: "pairing_complete";
  data: {
    kakaoUserId: string;
    pairedAt: string;
  };
  id?: string;
}

export interface SSEPairingExpiredEvent {
  event: "pairing_expired";
  data: {
    reason: string;
  };
  id?: string;
}

export type SSEEvent =
  | SSEMessageEvent
  | SSEPingEvent
  | SSEErrorEvent
  | SSEPairingCompleteEvent
  | SSEPairingExpiredEvent;

export interface SSEClientConfig {
  relayUrl: string;
  relayToken?: string; // Legacy token (environment variable or config)
  sessionToken?: string; // Auto-generated session token
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface SendReplyRequest {
  messageId: string;
  response: KakaoSkillResponse;
}

export interface SendReplyResponse {
  success: boolean;
  deliveredAt?: number;
  error?: string;
}

export interface RelayClientConfig {
  relayUrl: string;
  relayToken: string;
  timeoutMs?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type KakaoUserId = string;

export interface ParsedKakaoUser {
  botUserKey: string;
  plusfriendUserKey?: string;
  isFriend: boolean;
}

// ============================================================================
// Channel Data Types (OpenClaw channelData.kakao pattern)
// ============================================================================

export interface KakaoChannelData {
  outputs?: KakaoOutput[];
  quickReplies?: KakaoQuickReply[];

  simpleText?: { text: string };
  simpleImage?: { imageUrl: string; altText?: string };

  textCard?: KakaoTextCard["textCard"];
  basicCard?: KakaoBasicCard["basicCard"];
  commerceCard?: KakaoCommerceCard["commerceCard"];
  listCard?: KakaoListCard["listCard"];
  itemCard?: KakaoItemCard["itemCard"];

  carousel?: KakaoCarousel["carousel"];
}

export interface DeliverPayload {
  text?: string;
  mediaUrls?: string[];
  channelData?: {
    kakao?: KakaoChannelData;
  };
}

// ============================================================================
// Channel Account Snapshot (matches openclaw/plugin-sdk ChannelAccountSnapshot)
// ============================================================================

/**
 * Runtime snapshot of a channel account.
 * Shape-compatible with ChannelAccountSnapshot from openclaw/plugin-sdk.
 */
export interface ChannelAccountSnapshot {
  accountId: string;
  name?: string;
  enabled?: boolean;
  configured?: boolean;
  running?: boolean;
  connected?: boolean;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  lastInboundAt?: number | null;
  lastOutboundAt?: number | null;
}
