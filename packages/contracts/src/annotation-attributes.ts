import { z } from 'zod';

const MedicalTermAttributes = z.object({
  spanType: z.literal('MEDICAL_TERM'),
  category: z.enum(['drug', 'anatomy', 'condition', 'procedure', 'device']),
  note: z.string().optional(),
});

const MeasurementAttributes = z.object({
  spanType: z.literal('MEASUREMENT'),
  value: z.number(),
  unit: z.enum(['g', 'mg', 'ug', 'kg', 'ml', 'l', 'mm', 'cm', 'Ch', 'mmHg', 'IE']),
  normalizedValue: z.number().optional(),
  normalizedUnit: z.string().optional(),
});

const NumberAttributes = z.object({
  spanType: z.literal('NUMBER'),
  rendering: z.enum(['digits', 'words', 'mixed']),
  normalized: z.string(),
});

const FormattingCommandAttributes = z.object({
  spanType: z.literal('FORMATTING_COMMAND'),
  command: z.enum(['newline', 'paragraph', 'tab', 'period', 'comma']),
  literal: z.boolean(),
});

const NamedEntityAttributes = z.object({
  spanType: z.literal('NAMED_ENTITY'),
  entityType: z.enum(['person', 'place', 'organization', 'date', 'time', 'other']),
});

const SpelledOutAttributes = z.object({
  spanType: z.literal('SPELLED_OUT'),
  resolvedWord: z.string(),
});

export const SpanAttributesSchema = z.discriminatedUnion('spanType', [
  MedicalTermAttributes,
  MeasurementAttributes,
  NumberAttributes,
  FormattingCommandAttributes,
  NamedEntityAttributes,
  SpelledOutAttributes,
]);

export type SpanAttributes = z.infer<typeof SpanAttributesSchema>;
