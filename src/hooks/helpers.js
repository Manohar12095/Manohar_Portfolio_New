/** A value counts as "filled in" when it is not empty and not a placeholder. */
export function isSet(value) {
  if (!value || typeof value !== "string") return false;
  return !value.includes("YOUR_") && !value.includes("[");
}

/** Show dev-only editing hints while running `npm run dev`. */
export const IS_DEV = import.meta.env.DEV;
