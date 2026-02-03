/**
 * Plugin Export Integration Tests
 * 
 * 플러그인이 OpenClaw에서 기대하는 형태로 export되는지 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import plugin from '../../index.js';
import { kakaoPlugin } from '../../src/channel.js';

describe('Plugin Export', () => {
  describe('Default Export (plugin)', () => {
    it('should export plugin with required fields', () => {
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('kakao-talkchannel');
      expect(plugin.name).toBe('Kakao TalkChannel');
      expect(plugin.description).toBeDefined();
    });
    
    it('should have configSchema', () => {
      expect(plugin.configSchema).toBeDefined();
    });
    
    it('should have register function', () => {
      expect(plugin.register).toBeTypeOf('function');
    });
  });
  
  describe('Channel Plugin (kakaoPlugin)', () => {
    it('should export channel plugin with required fields', () => {
      expect(kakaoPlugin).toBeDefined();
      expect(kakaoPlugin.id).toBe('kakao-talkchannel');
    });

    it('should have meta information', () => {
      expect(kakaoPlugin.meta).toBeDefined();
      expect(kakaoPlugin.meta.id).toBe('kakao-talkchannel');
      expect(kakaoPlugin.meta.label).toBeDefined();
      expect(kakaoPlugin.meta.selectionLabel).toBeDefined();
      expect(kakaoPlugin.meta.blurb).toBeDefined();
    });
    
    it('should have capabilities', () => {
      expect(kakaoPlugin.capabilities).toBeDefined();
      expect(kakaoPlugin.capabilities.chatTypes).toContain('direct');
      expect(kakaoPlugin.capabilities.blockStreaming).toBe(true);
    });
    
    it('should have config adapter', () => {
      expect(kakaoPlugin.config).toBeDefined();
      expect(kakaoPlugin.config.listAccountIds).toBeTypeOf('function');
      expect(kakaoPlugin.config.resolveAccount).toBeTypeOf('function');
      expect(kakaoPlugin.config.defaultAccountId).toBeTypeOf('function');
      expect(kakaoPlugin.config.isConfigured).toBeTypeOf('function');
      expect(kakaoPlugin.config.isEnabled).toBeTypeOf('function');
    });
    
    it('should have outbound adapter', () => {
      expect(kakaoPlugin.outbound).toBeDefined();
      expect(kakaoPlugin.outbound.sendText).toBeTypeOf('function');
      expect(kakaoPlugin.outbound.textChunkLimit).toBe(400);
    });
    
    it('should have optional adapters', () => {
      expect(kakaoPlugin.status).toBeDefined();
      expect(kakaoPlugin.security).toBeDefined();
      expect(kakaoPlugin.pairing).toBeDefined();
    });
    
    it('should have security adapter for DM policy', () => {
      expect(kakaoPlugin.security?.resolveDmPolicy).toBeTypeOf('function');
      expect(kakaoPlugin.security?.collectWarnings).toBeTypeOf('function');
    });
    
    it('should have pairing adapter', () => {
      expect(kakaoPlugin.pairing?.idLabel).toBe('kakaoUserId');
      expect(kakaoPlugin.pairing?.normalizeAllowEntry).toBeTypeOf('function');
    });
    
    it('should have reload configuration', () => {
      expect(kakaoPlugin.reload).toBeDefined();
      expect(kakaoPlugin.reload.configPrefixes).toContain('channels.kakao-talkchannel');
    });
  });
  
  describe('Config Schema Validation', () => {
    it('should have valid configSchema export', () => {
      expect(kakaoPlugin.configSchema).toBeDefined();
    });
  });
});
