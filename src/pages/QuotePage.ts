import type { Locator, Page } from '@playwright/test';
import type { Lang } from '../lang';
import { routes } from '../routes';

/**
 * The quote page, which is where a successful signup lands. Only the parts that confirm
 * the signup worked are modelled here; choosing a mortgage is a different flow.
 */
export class QuotePage {
  readonly heading: Locator;
  /** Avatar in the header. Shows the signed-in user's initials. */
  readonly userInitials: Locator;

  constructor(page: Page) {
    // Level 1: the page also has h2 card titles for each mortgage option.
    this.heading = page.getByRole('heading', { level: 1 });
    this.userInitials = page.getByTestId('menu-button');
  }

  static pathFor(lang: Lang): string {
    return routes.quote[lang];
  }
}
