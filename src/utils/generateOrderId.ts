export function generateOrderId(): string {
  const prefix = "CD";
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toTimeString().split(" ")[0].replace(/:/g, "");

  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${prefix}-${datePart}${timePart}-${randomPart}`;
}
