import type { GuestStory, GuestStoryItem } from "@/lib/guest-profile";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { useT } from "@/i18n";
import { ChevronRight } from "lucide-react";

/**
 * Story component - EXACT match to image design
 * Shows timeline with venue covers and timestamp dots
 */
export interface StoryProps extends Omit<SectorProps, "sector" | "hasData"> {
  story: GuestStory | null;
  maxDisplay?: number;
  interactive?: boolean;
  onItemClick?: (item: GuestStoryItem) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
  completion?: SectionCompletion;
  isSelf?: boolean;
}

const FALLBACK_COVER = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80";

/**
 * Story item card - EXACT from image: rounded image with timestamp dot
 */
function StoryItemCard({
  item,
  interactive,
  onClick,
}: {
  item: GuestStoryItem;
  interactive: boolean;
  onClick?: (item: GuestStoryItem) => void;
}) {
  const date = new Date(item.date);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const content = (
    <div className="group relative h-32 w-40 rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform">
      {/* Image */}
      <img
        src={item.coverUrl || FALLBACK_COVER}
        alt={item.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <p className="text-xs text-white/60">{item.venueName}</p>
      </div>
      
      {/* Timestamp dot - EXACT from image: purple dot on top center */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-purple-500 border-2 border-white shadow-lg" />
    </div>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(item)}
        className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-2xl"
      >
        {content}
      </button>
    );
  }

  return content;
}

/**
 * Timeline connector - EXACT from image: dotted line between items
 */
function TimelineConnector() {
  return (
    <div className="flex-1 h-px bg-gradient-to-r from-purple-500 to-purple-500/0 self-center my-4 hidden sm:block" />
  );
}

export function Story({
  story,
  maxDisplay = 4,
  interactive = false,
  onItemClick,
  showViewAll = false,
  onViewAll,
  completion,
  isSelf = false,
  children,
  ...props
}: StoryProps) {
  const t = useT();
  
  const items = story?.items || [];
  const hasStory = items.length > 0 || !!completion?.isComplete;

  if (!hasStory) {
    return null;
  }

  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const displayedItems = sortedItems.slice(0, maxDisplay);
  const remainingCount = sortedItems.length - displayedItems.length;

  return (
    <Sector 
      sector="story" 
      hasData={hasStory}
      completion={completion}
      isSelf={isSelf}
      {...props}
    >
      <div className="flex items-center gap-0 w-full overflow-x-auto pb-2 -mx-2 px-2">
        {displayedItems.map((item, index) => (
          <div key={item.id} className="flex flex-col items-center shrink-0">
            <StoryItemCard
              item={item}
              interactive={interactive}
              onClick={onItemClick}
            />
            {index < displayedItems.length - 1 && (
              <TimelineConnector />
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="flex flex-col items-center shrink-0">
            <div className="h-32 w-40 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-white/60">+{remainingCount}</span>
            </div>
          </div>
        )}
      </div>
      
      {showViewAll && onViewAll && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t("common.viewAll")}
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
      
      {children}
    </Sector>
  );
}

export function StoryFilmstrip({
  items,
  onItemClick,
}: {
  items: GuestStoryItem[];
  onItemClick?: (item: GuestStoryItem) => void;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {sortedItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick?.(item)}
          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-2xl"
        >
          <StoryItemCard item={item} interactive={true} onClick={onItemClick} />
        </button>
      ))}
    </div>
  );
}
