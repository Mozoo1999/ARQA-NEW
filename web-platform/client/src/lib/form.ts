/**
 * Form utilities for NARQA EBOS
 * 
 * zod v4 + react-hook-form compatibility:
 * - z.coerce.number() has `unknown` input type in zod v4, causing TypeScript errors
 * - Solution: use z.number().optional() and convert in onSubmit, OR use explicit type params
 * - This file provides a helper to use useForm with explicit input/output types
 */

export { zodResolver } from "@hookform/resolvers/zod";

/**
 * Helper to convert string input to optional number
 * Use in form onSubmit handlers when form field is a string but schema expects number
 */
export function toOptionalNumber(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

/**
 * Helper to convert string input to number
 */
export function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
