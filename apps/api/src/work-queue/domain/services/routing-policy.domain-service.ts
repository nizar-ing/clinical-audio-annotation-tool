export class RoutingPolicyDomainService {
  static routeByDuration(durationSeconds: number): 'UPLOADED' | 'REJECTED_TOO_SHORT' {
    // Raw float — no rounding; the brief requires the comparison to be exact
    return durationSeconds <= 15.0 ? 'REJECTED_TOO_SHORT' : 'UPLOADED';
  }
}
