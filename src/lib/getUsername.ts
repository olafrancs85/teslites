export default function getUsername(email?: unknown): string {
  if (!email || typeof email !== "string") return "anonymous";

  // If it looks like an email, use the part before "@"
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  // Otherwise, just return it as a string (fallback)
  return String(email);
}
