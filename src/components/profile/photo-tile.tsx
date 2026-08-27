import { useState } from "react";
import type { GuestStoryItem } from "@/lib/guest-profile";

/**
 * Photo tile component used in Loves, Here, and Story sectors.
 * Displays an image with a label overlay.
 */
export interface PhotoTileProps {
  /**
   * URL of the image to display.
   * For Unsplash: use the URL directly.
   * For venue covers: use the coverUrl from the story item.
   */
  imageUrl: string | null;
  
  /**
   * Label to display on the tile.
   */
  label: string;
  
  /**
   * Optional subtitle (e.g., venue name for story items).
   */
  subtitle?: string;
  
  /**
   * Size variant: "small" (100px), "medium" (150px), "large" (200px).
   * Default is "medium".
   */
  size?: "small" | "medium" | "large";
  
  /**
   * Click handler.
   */
  onClick?: () => void;
  
  /**
   * Whether the tile is interactive.
   */
  interactive?: boolean;
  
  /**
   * Fallback image URL if the main image fails to load.
   */
  fallbackUrl?: string;
}

const SIZE_CLASSES = {
  small: "w-20 h-20",
  medium: "w-24 h-24",
  large: "w-32 h-32",
};

const FALLBACK_COVER = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80"; // Cafe interior

/**
 * Default photo tile for interests and intentions.
 * Uses Unsplash images with label overlay.
 */
export function PhotoTile({
  imageUrl,
  label,
  subtitle,
  size = "medium",
  onClick,
  interactive = false,
  fallbackUrl = FALLBACK_COVER,
}: PhotoTileProps) {
  const [imageError, setImageError] = useState(false);
  
  const displayUrl = imageUrl && !imageError ? imageUrl : fallbackUrl;
  const sizeClass = SIZE_CLASSES[size];
  
  const handleImageError = () => {
    setImageError(true);
  };

  const content = (
    <div className={`relative overflow-hidden rounded-2xl ${sizeClass} shrink-0`}>
      {/* Image */}
      <img
        src={displayUrl}
        alt={label}
        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="truncate text-xs font-medium text-white drop-shadow-md">{label}</p>
        {subtitle && (
          <p className="truncate text-xs text-white/70 drop-shadow-md">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl transition-transform hover:scale-105"
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return content;
}

/**
 * Story photo tile - specialized for story items (past gatherings).
 * Shows venue cover with gathering title and date.
 */
export interface StoryPhotoTileProps {
  item: GuestStoryItem;
  size?: "small" | "medium" | "large";
  onClick?: (item: GuestStoryItem) => void;
  interactive?: boolean;
}

export function StoryPhotoTile({
  item,
  size = "medium",
  onClick,
  interactive = false,
}: StoryPhotoTileProps) {
  const handleClick = () => {
    if (onClick) onClick(item);
  };

  // Format date
  const date = new Date(item.date);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PhotoTile
      imageUrl={item.coverUrl}
      label={item.title}
      subtitle={`${item.venueName} • ${dateStr}`}
      size={size}
      onClick={interactive ? handleClick : undefined}
      interactive={interactive}
      fallbackUrl={FALLBACK_COVER}
    />
  );
}
