import { describe, it, expect } from 'vitest';
import { RoutingPolicyDomainService } from '../services/routing-policy.domain-service.js';

describe('RoutingPolicyDomainService.routeByDuration', () => {
  it('rejects recordings of exactly 15.000 seconds', () => {
    expect(RoutingPolicyDomainService.routeByDuration(15.0)).toBe('REJECTED_TOO_SHORT');
  });

  it('rejects recordings shorter than 15 seconds', () => {
    expect(RoutingPolicyDomainService.routeByDuration(14.999)).toBe('REJECTED_TOO_SHORT');
  });

  it('accepts recordings longer than 15 seconds', () => {
    expect(RoutingPolicyDomainService.routeByDuration(15.001)).toBe('UPLOADED');
  });

  it('rejects zero-length recordings', () => {
    expect(RoutingPolicyDomainService.routeByDuration(0)).toBe('REJECTED_TOO_SHORT');
  });

  it('accepts typical clinical dictation lengths', () => {
    expect(RoutingPolicyDomainService.routeByDuration(42.3)).toBe('UPLOADED');
  });
});
