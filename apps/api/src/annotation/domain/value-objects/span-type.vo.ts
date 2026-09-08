export const SPAN_TYPES = [
  'MEDICAL_TERM',
  'MEASUREMENT',
  'NUMBER',
  'FORMATTING_COMMAND',
  'NAMED_ENTITY',
  'SPELLED_OUT',
] as const;

export type SpanType = (typeof SPAN_TYPES)[number];
