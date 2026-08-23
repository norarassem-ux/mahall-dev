// Small, reusable rating display — used on venue cards and the venue detail page.
export default function StarRating({ rating, count, showLabel = true }) {
  return (
    <span>
      ★ {rating}
      {showLabel && ` (${count})`}
    </span>
  );
}
