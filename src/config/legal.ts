// Public legal details only. Leave unknown details empty; never invent an entity
// or publish an unmonitored contact. The owner requested no email addresses yet.
export const legalDetails = {
  operatorName: "",
  contactUrl: "",
  postalAddress: "",
};

export function legalContactHref(value = legalDetails.contactUrl): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
