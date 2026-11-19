import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Minimal 8 karakter")
  .regex(/[a-z]/, "Perlu satu huruf kecil")
  .regex(/[0-9]/, "Perlu satu angka");

export function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;
  return score;
}
