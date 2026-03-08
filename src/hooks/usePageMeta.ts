import { useEffect } from 'react';

const SITE_NAME = 'PantryCheff';
const DEFAULT_TITLE = `${SITE_NAME} – AI Pantry Tracker & Recipe Generator From Ingredients You Have`;
const DEFAULT_DESCRIPTION =
  'Track your pantry, get recipes from ingredients you have, reduce food waste. AI pantry scanner and ingredient-based recipe finder.';

/**
 * Updates document title, meta description, and optional robots for the current route.
 * Use for better tab titles and any crawler that executes JS.
 */
export function usePageMeta(
  title: string | null,
  description?: string | null,
  options?: { noindex?: boolean }
) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    let metaRobots = document.querySelector('meta[name="robots"]');

    if (title) {
      document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    if (description && metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    if (options?.noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else if (metaRobots) {
      metaRobots.setAttribute('content', 'index, follow');
    }

    return () => {
      document.title = previousTitle;
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESCRIPTION);
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    };
  }, [title, description, options?.noindex]);
}
