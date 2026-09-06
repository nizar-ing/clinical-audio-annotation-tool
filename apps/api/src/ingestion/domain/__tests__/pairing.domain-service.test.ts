import { describe, it, expect } from 'vitest';
import { PairingDomainService } from '../services/pairing.domain-service.js';

const audio = (path: string) => ({ id: path, originalFilename: path.split('/').pop() ?? path, storagePath: path });
const row = (path: string) => ({ id: path, path, label: 'label' });

describe('PairingDomainService', () => {
  describe('rung 1 — exact path', () => {
    it('pairs when import row path equals recording storage path exactly', () => {
      const result = PairingDomainService.pair(
        [audio('audio/880_NTX.wav')],
        [row('audio/880_NTX.wav')],
      );
      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedRows).toHaveLength(0);
    });
  });

  describe('rung 2 — basename', () => {
    it('pairs when import row path is just the basename', () => {
      const result = PairingDomainService.pair(
        [audio('audio/880_NTX.wav')],
        [row('880_NTX.wav')],
      );
      expect(result.matched).toHaveLength(1);
    });
  });

  describe('rung 3 — case-insensitive basename', () => {
    it('pairs when basenames differ only in case', () => {
      const result = PairingDomainService.pair(
        [audio('audio/880_NTX.wav')],
        [row('880_ntx.wav')],
      );
      expect(result.matched).toHaveLength(1);
    });
  });

  describe('rung 4 — basename without extension', () => {
    it('pairs when import row path has no extension', () => {
      const result = PairingDomainService.pair(
        [audio('audio/880_NTX.wav')],
        [row('880_NTX')],
      );
      expect(result.matched).toHaveLength(1);
    });

    it('pairs case-insensitively without extension', () => {
      const result = PairingDomainService.pair(
        [audio('audio/880_NTX.wav')],
        [row('880_ntx')],
      );
      expect(result.matched).toHaveLength(1);
    });
  });

  describe('unmatched items', () => {
    it('surfaces unmatched audio', () => {
      const result = PairingDomainService.pair(
        [audio('audio/orphan.wav')],
        [],
      );
      expect(result.unmatchedAudio).toHaveLength(1);
      expect(result.matched).toHaveLength(0);
    });

    it('surfaces unmatched transcript rows', () => {
      const result = PairingDomainService.pair(
        [],
        [row('audio/missing.wav')],
      );
      expect(result.unmatchedRows).toHaveLength(1);
      expect(result.matched).toHaveLength(0);
    });
  });

  describe('ambiguous basename', () => {
    it('flags both recordings when two share the same basename and neither is paired', () => {
      const result = PairingDomainService.pair(
        [audio('folder_a/rec.wav'), audio('folder_b/rec.wav')],
        [row('rec.wav')],
      );
      expect(result.matched).toHaveLength(0);
      expect(result.ambiguous).toHaveLength(1);
      expect(result.ambiguous[0]!.candidates).toHaveLength(2);
    });

    it('does not flag ambiguity when the exact path is unique', () => {
      const result = PairingDomainService.pair(
        [audio('audio/rec.wav'), audio('folder_b/rec.wav')],
        [row('audio/rec.wav')],
      );
      expect(result.matched).toHaveLength(1);
      expect(result.ambiguous).toHaveLength(0);
    });
  });

  describe('duplicate row paths', () => {
    it('treats duplicate import row paths as separate unmatched rows', () => {
      const result = PairingDomainService.pair(
        [audio('audio/rec.wav')],
        // Real ImportRows always have distinct UUIDs even when the path is identical
        [{ id: 'row-1', path: 'audio/rec.wav', label: 'label' },
         { id: 'row-2', path: 'audio/rec.wav', label: 'label' }],
      );
      // First matches, second is a duplicate — both get reported in errors by the use case.
      // Domain service matches the first and leaves the second unmatched.
      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedRows).toHaveLength(1);
    });
  });

  describe('multiple recordings and rows', () => {
    it('pairs each recording to exactly one row', () => {
      const result = PairingDomainService.pair(
        [audio('audio/a.wav'), audio('audio/b.wav')],
        [row('audio/a.wav'), row('audio/b.wav')],
      );
      expect(result.matched).toHaveLength(2);
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedRows).toHaveLength(0);
    });
  });
});
