/**
 * Cake catalog — upload validation.
 *
 * The rules moved to `@/lib/imageFiles` once the combos catalog needed the same
 * ones; this re-export keeps the cake-side call sites reading in their own
 * vocabulary. Pure, shared by the drop zones and the context so a dragged file
 * and a browsed file are judged identically.
 */

export {
  validateImageFile,
  dragCarriesFiles,
  type ImageRejection,
} from '@/lib/imageFiles';
