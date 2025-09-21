export default function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")     // Remove invalid chars
    .replace(/\s+/g, "-")             // Replace spaces with -
    .replace(/-+/g, "-");             // Replace multiple - with single -
}
