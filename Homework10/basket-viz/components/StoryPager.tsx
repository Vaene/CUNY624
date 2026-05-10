"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type StoryPage = {
  href: string;
  label: string;
};

const STORY_PAGES: StoryPage[] = [
  {
    href: "/",
    label: "Overview",
  },
  {
    href: "/dataset",
    label: "Dataset",
  },
  {
    href: "/rules",
    label: "Rules",
  },
  {
    href: "/rules-graph",
    label: "Rules graph",
  },
  {
    href: "/interpretation",
    label: "Interpretation",
  },
  {
    href: "/clustering",
    label: "Clustering",
  },
  {
    href: "/basket-clusters",
    label: "Basket clusters",
  },
  {
    href: "/cluster-profiles",
    label: "Profiles",
  },
  {
    href: "/conclusion",
    label: "Conclusion",
  },
];

function getPageIndex(pathname: string) {
  const exactIndex = STORY_PAGES.findIndex((page) => page.href === pathname);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const normalized = pathname.replace(/\/+$/, "");
  return STORY_PAGES.findIndex((page) => page.href === normalized);
}

export default function StoryPager() {
  const pathname = usePathname();
  const currentIndex = getPageIndex(pathname);

  if (currentIndex < 0) {
    return null;
  }

  const previousPage = currentIndex > 0 ? STORY_PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < STORY_PAGES.length - 1 ? STORY_PAGES[currentIndex + 1] : null;

  return (
    <nav className="story-pager" aria-label="Story pages">
      <div className="story-pager-group">
        <Link
          href={previousPage?.href ?? pathname}
          className={`story-pager-arrow ${previousPage ? "" : "is-disabled"}`}
          aria-label={previousPage ? `Previous page: ${previousPage.label}` : "Previous page unavailable"}
          aria-disabled={!previousPage}
          tabIndex={previousPage ? 0 : -1}
        >
          <span aria-hidden="true">←</span>
        </Link>
      </div>

      <div className="story-pager-dots" aria-label="Page position">
        {STORY_PAGES.map((page, index) => {
          const isActive = index === currentIndex;
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`story-pager-dot ${isActive ? "is-active" : ""}`}
              aria-label={`${index + 1} of ${STORY_PAGES.length}: ${page.label}`}
              aria-current={isActive ? "page" : undefined}
            />
          );
        })}
      </div>

      <div className="story-pager-group">
        <Link
          href={nextPage?.href ?? pathname}
          className={`story-pager-arrow ${nextPage ? "" : "is-disabled"}`}
          aria-label={nextPage ? `Next page: ${nextPage.label}` : "Next page unavailable"}
          aria-disabled={!nextPage}
          tabIndex={nextPage ? 0 : -1}
        >
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </nav>
  );
}
