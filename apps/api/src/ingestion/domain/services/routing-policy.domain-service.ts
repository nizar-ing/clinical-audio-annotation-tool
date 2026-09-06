import type { RecordingStatus } from '../value-objects/recording-status.vo.js';

export class RoutingPolicyDomainService {
  static routeByDuration(durationSeconds: number): Extract<RecordingStatus, 'UPLOADED' | 'REJECTED_TOO_SHORT'> {
    return durationSeconds <= 15.0 ? 'REJECTED_TOO_SHORT' : 'UPLOADED';
  }
}
