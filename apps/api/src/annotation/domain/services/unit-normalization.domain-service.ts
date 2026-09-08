import { normalizeUnit } from '../value-objects/measurement-unit.vo.js';
import type { Unit, NormalizationResult } from '../value-objects/measurement-unit.vo.js';

export class UnitNormalizationDomainService {
  static normalize(value: number, unit: Unit): NormalizationResult | null {
    return normalizeUnit(value, unit);
  }
}
