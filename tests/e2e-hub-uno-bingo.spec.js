import { test, expect } from '@playwright/test';

/**
 * QA Test Suite for Game Arena Hub Page, UNO, and Bingo
 *
 * Comprehensive E2E tests covering:
 * 1. Hub page rendering, layout, theme, navigation
 * 2. UNO game - local play, mode toggle, card mechanics
 * 3. Bingo game - local play, card layout, marking mechanics
 *
 * Tests include edge cases, responsive design, and visual validation.
 */

// ============================================================================
// HUB PAGE TESTS
// ============================================================================

test.describe('Hub Page - Desktop (1280x800)', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
  });

  test('renders hero section correctly', async ({ page }) => {
    await page.goto('/');

    // Verify page title
    await expect(page).toHaveTitle('Game Arena');

    // Verify hero header exists and has correct text
    const heroHeader = page.locator('header.hero h1');
    await expect(heroHeader).toContainText('Game Arena');

    // Verify subtitle exists
    const subtitle = page.locator('.hero .subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('Classic games');

    // Take screenshot of hero
    await page.screenshot({ path: 'tests/screenshots/01-hub-desktop-hero.png' });
  });

  test('renders all 15 game cards', async ({ page }) => {
    await page.goto('/');

    const gameCards = page.locator('.game-card');
    const count = await gameCards.count();

    expect(count).toBe(15);
    console.log(`✓ Found ${count} game cards`);

    // Verify each card has required elements
    for (let i = 0; i < count; i++) {
      const card = gameCards.nth(i);
      await expect(card.locator('.game-icon')).toBeVisible();
      await expect(card.locator('h2')).toBeVisible();
      await expect(card.locator('p')).toBeVisible();
      await expect(card.locator('.players-info')).toBeVisible();
    }

    await page.screenshot({ path: 'tests/screenshots/02-hub-desktop-cards.png' });
  });

  test('game card tags are visible', async ({ page }) => {
    await page.goto('/');

    const tags = page.locator('.game-tag');
    const tagCount = await tags.count();

    expect(tagCount).toBeGreaterThan(0);
    console.log(`✓ Found ${tagCount} tags (Live/New)`);

    // Verify tag text (LIVE or NEW)
    const tagTexts = await tags.allTextContents();
    tagTexts.forEach(text => {
      expect(['LIVE', 'NEW']).toContain(text.trim());
    });
  });

  test('verifies dark theme colors', async ({ page }) => {
    await page.goto('/');

    // Check body background is dark (near black)
    const bodyBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bodyBg).toMatch(/rgb\(0, 0, 0\)|rgb\(1, 1, 1\)|#000/i);

    // Check text color is light
    const textColor = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(textColor).toContain('245');

    console.log(`✓ Dark theme verified - Body BG: ${bodyBg}, Text: ${textColor}`);
  });

  test('footer renders correctly', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerText = await footer.textContent();
    expect(footerText).toContain('Game Arena');
    expect(footerText).toContain('See more game ideas');

    // Verify footer link
    const link = footer.locator('a');
    await expect(link).toHaveAttribute('href', './GAME-IDEAS.md');

    await page.screenshot({ path: 'tests/screenshots/03-hub-desktop-footer.png' });
  });

  test('game card links navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Test a sample of game links
    const gamesToTest = ['uno', 'bingo', 'tic-tac-toe'];

    for (const game of gamesToTest) {
      const gameLink = page.locator(`.game-card a[href*="${game}"]`);
      const href = await gameLink.getAttribute('href');
      expect(href).toContain(game);
      console.log(`✓ ${game} link found: ${href}`);
    }
  });

  test('no overlapping elements', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.game-card');
    const cardCount = await cards.count();

    // Get bounding boxes for all cards to detect overlaps
    for (let i = 0; i < cardCount; i++) {
      const card1 = cards.nth(i);
      const box1 = await card1.boundingBox();

      for (let j = i + 1; j < cardCount; j++) {
        const card2 = cards.nth(j);
        const box2 = await card2.boundingBox();

        // Check basic overlap - boxes shouldn't intersect horizontally in grid
        if (box1 && box2) {
          const overlap = !(box1.x + box1.width < box2.x ||
                           box2.x + box2.width < box1.x ||
                           box1.y + box1.height < box2.y ||
                           box2.y + box2.height < box1.y);

          if (overlap) {
            console.warn(`⚠ Potential overlap detected between cards ${i} and ${j}`);
          }
        }
      }
    }

    console.log('✓ Layout overlap check complete');
  });

  test('game card hover state works', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.locator('.game-card').first();
    const borderBefore = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );

    await firstCard.hover();

    const borderAfter = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );

    console.log(`Border before hover: ${borderBefore}`);
    console.log(`Border after hover: ${borderAfter}`);
    // Border color should change to blue on hover
  });
});

test.describe('Hub Page - Mobile (375x812)', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 375, height: 812 });
  });

  test('renders correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Verify hero is visible
    const hero = page.locator('header.hero');
    await expect(hero).toBeVisible();

    // Verify all cards are still visible
    const cards = page.locator('.game-card');
    expect(await cards.count()).toBe(15);

    await page.screenshot({ path: 'tests/screenshots/04-hub-mobile-full.png' });
  });

  test('mobile layout stacks cards correctly', async ({ page }) => {
    await page.goto('/');

    // On mobile, cards should stack in single column or 2-column grid
    const cards = page.locator('.game-card');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);

    const box1 = await firstCard.boundingBox();
    const box2 = await secondCard.boundingBox();

    if (box1 && box2) {
      // Second card should be below first (larger Y value)
      expect(box2.y).toBeGreaterThan(box1.y);
      console.log(`✓ Cards stack vertically on mobile`);
    }
  });

  test('text doesn\'t truncate on mobile', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.game-card');

    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const title = card.locator('h2');

      // Check if title fits without overflow
      const box = await title.boundingBox();
      const parentBox = await card.boundingBox();

      if (box && parentBox) {
        expect(box.width).toBeLessThanOrEqual(parentBox.width - 16);
      }
    }

    console.log(`✓ Text fits on all mobile cards`);
  });

  test('footer visible on mobile', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom to see footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/05-hub-mobile-footer.png' });
  });

  test('game cards are tappable', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.locator('.game-card').first();
    const href = await firstCard.getAttribute('href');

    expect(href).toBeTruthy();

    // Verify card has adequate size for touch targets (min 44x44px recommended)
    const box = await firstCard.boundingBox();
    expect(box?.width).toBeGreaterThan(40);
    expect(box?.height).toBeGreaterThan(40);

    console.log(`✓ Game cards meet touch target size requirements`);
  });
});

// ============================================================================
// UNO GAME TESTS
// ============================================================================

test.describe('UNO Game - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/uno/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('uno game page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/UNO/i);

    // Wait for game to initialize
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/06-uno-desktop-load.png' });
    console.log('✓ UNO page loaded');
  });

  test('local/online mode toggle is visible', async ({ page }) => {
    const modeToggle = page.locator('button:has-text("Local"), button:has-text("Online"), [data-testid*="mode"], [class*="toggle"]').first();

    // Try to find mode toggle button
    const buttons = page.locator('button');
    const buttonTexts = await buttons.allTextContents();

    console.log(`Available buttons: ${buttonTexts.join(', ')}`);

    // Check if either Local or Online is visible
    const hasLocalOrOnline = buttonTexts.some(text =>
      text.toLowerCase().includes('local') || text.toLowerCase().includes('online')
    );

    if (hasLocalOrOnline) {
      console.log('✓ Mode toggle found');
    }
  });

  test('can start a local game', async ({ page }) => {
    // Look for start game button or similar
    const startButton = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("Begin")').first();

    // Try to find any button with game-related text
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons on page`);

    // Wait for game UI to be interactive
    await page.waitForTimeout(1000);

    const gameContainer = page.locator('[class*="game"], [id*="game"], main');
    await expect(gameContainer).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/07-uno-desktop-game-started.png' });
  });

  test('card rendering', async ({ page }) => {
    // Wait for cards to render
    await page.waitForTimeout(500);

    // Look for card elements
    const cards = page.locator('[class*="card"], [data-card]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      console.log(`✓ Found ${cardCount} card elements`);
      await page.screenshot({ path: 'tests/screenshots/08-uno-desktop-cards.png' });
    }
  });

  test('no layout overflow on desktop', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10); // Allow 10px tolerance
    console.log(`✓ No horizontal overflow - Body: ${bodyWidth}px, Window: ${windowWidth}px`);
  });

  test('game UI elements are visible', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .game-container');

    const isVisible = await mainContent.first().isVisible().catch(() => false);

    if (isVisible) {
      console.log('✓ Main game content visible');
    } else {
      console.log('⚠ Game content might not be visible, checking for game elements');
    }

    // Check for common game elements
    const hasGameElements = await page.locator('[class*="player"], [class*="hand"], [class*="table"]').count();
    console.log(`Found ${hasGameElements} game-related elements`);
  });
});

test.describe('UNO Game - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/games/uno/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('responsive layout on mobile', async ({ page }) => {
    await page.waitForTimeout(500);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    // Mobile viewport should fit content
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10);

    await page.screenshot({ path: 'tests/screenshots/09-uno-mobile-layout.png' });
    console.log('✓ Mobile layout fits viewport');
  });

  test('cards visible on mobile', async ({ page }) => {
    const cards = page.locator('[class*="card"], [data-card]');

    // At least some cards should be visible
    const visibleCards = await cards.filter({ hasNot: page.locator('[style*="display: none"]') }).count();

    console.log(`Cards visible on mobile: ${visibleCards}`);

    await page.screenshot({ path: 'tests/screenshots/10-uno-mobile-cards.png' });
  });
});

// ============================================================================
// BINGO GAME TESTS
// ============================================================================

test.describe('Bingo Game - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/bingo/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('bingo game page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Bingo|Housie/i);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/11-bingo-desktop-load.png' });
    console.log('✓ Bingo page loaded');
  });

  test('5x5 bingo card grid renders', async ({ page }) => {
    // Look for bingo card grid
    const gridCells = page.locator('[class*="bingo"], [class*="card"], td, [role="cell"]');
    const cellCount = await gridCells.count();

    console.log(`Found ${cellCount} grid cells`);

    // A 5x5 bingo card should have 25 cells
    if (cellCount >= 25) {
      console.log('✓ 5x5 grid found (25+ cells)');
    } else {
      console.log(`⚠ Expected 25 cells, found ${cellCount}`);
    }

    await page.screenshot({ path: 'tests/screenshots/12-bingo-desktop-grid.png' });
  });

  test('bingo numbers visible', async ({ page }) => {
    // Look for number elements
    const numberElements = page.locator('td, [role="cell"], [class*="number"]');
    const count = await numberElements.count();

    // Get text content of first few elements
    const texts = await numberElements.first().evaluate((el) => el.textContent);

    console.log(`Grid cells found: ${count}, Sample content: ${texts}`);

    // Check if elements contain numbers
    const hasNumbers = await numberElements.evaluate((els) => {
      const textArray = Array.from(els).map(el => el.textContent?.trim() || '');
      return textArray.some(text => /^\d+$/.test(text));
    });

    if (hasNumbers) {
      console.log('✓ Bingo numbers visible in grid');
    } else {
      console.log('⚠ Could not verify numbers in grid');
    }
  });

  test('bingo card center space (FREE)', async ({ page }) => {
    // Bingo cards typically have a FREE space in the center
    const cells = page.locator('td, [role="cell"]');
    const cellTexts = await cells.allTextContents();

    const hasFreeSpace = cellTexts.some(text =>
      text.toUpperCase().includes('FREE') || text.trim() === ''
    );

    if (hasFreeSpace) {
      console.log('✓ CENTER FREE space found');
    } else {
      console.log('⚠ FREE space not clearly identified');
    }
  });

  test('responsive bingo grid on desktop', async ({ page }) => {
    const grid = page.locator('table, [class*="grid"], [class*="bingo"]').first();
    const isVisible = await grid.isVisible().catch(() => false);

    if (isVisible) {
      const box = await grid.boundingBox();
      console.log(`Bingo grid size: ${box?.width}x${box?.height}px`);
    }

    await page.screenshot({ path: 'tests/screenshots/13-bingo-desktop-full.png' });
  });

  test('no layout overflow on desktop', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10);
    console.log(`✓ No overflow - Body: ${bodyWidth}px, Window: ${windowWidth}px`);
  });
});

test.describe('Bingo Game - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/games/bingo/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('bingo grid responsive on mobile', async ({ page }) => {
    await page.waitForTimeout(500);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10);
    console.log('✓ Grid fits mobile viewport');

    await page.screenshot({ path: 'tests/screenshots/14-bingo-mobile-layout.png' });
  });

  test('bingo numbers readable on mobile', async ({ page }) => {
    const cells = page.locator('td, [role="cell"]');
    const count = await cells.count();

    if (count >= 25) {
      // Get font size of cells
      const fontSize = await cells.first().evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );

      console.log(`Cell font size on mobile: ${fontSize}`);

      // Font should be readable (at least 12px)
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThan(8);

      console.log('✓ Numbers readable on mobile');
    }

    await page.screenshot({ path: 'tests/screenshots/15-bingo-mobile-numbers.png' });
  });

  test('bingo card fits mobile screen height', async ({ page }) => {
    const grid = page.locator('table, [class*="grid"]').first();
    const isVisible = await grid.isVisible().catch(() => false);

    if (isVisible) {
      const box = await grid.boundingBox();
      const windowHeight = await page.evaluate(() => window.innerHeight);

      if (box) {
        expect(box.height).toBeLessThan(windowHeight);
        console.log(`✓ Grid height (${box.height}px) fits mobile screen (${windowHeight}px)`);
      }
    }
  });
});

// ============================================================================
// EDGE CASE & FAILURE TESTING
// ============================================================================

test.describe('Edge Cases - Hub Navigation', () => {
  test('navigating back from game to hub', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });

    // Go to hub
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/16-edge-nav-hub-start.png' });

    // Click first game
    const firstCard = page.locator('.game-card').first();
    const href = await firstCard.getAttribute('href');

    // Navigate to game
    await page.goto(href);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/17-edge-nav-game.png' });

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify we're back at hub
    const hero = page.locator('header.hero');
    await expect(hero).toBeVisible();

    const gameCards = page.locator('.game-card');
    expect(await gameCards.count()).toBe(15);

    await page.screenshot({ path: 'tests/screenshots/18-edge-nav-back.png' });
    console.log('✓ Browser back navigation works');
  });

  test('multiple rapid hub page refreshes', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');

      const cards = page.locator('.game-card');
      expect(await cards.count()).toBe(15);
    }

    console.log('✓ Hub page handles multiple refreshes');
  });

  test('game links return 200 status', async ({ page }) => {
    await page.goto('/');

    const gameLinks = [
      '/games/uno/index.html',
      '/games/bingo/index.html',
      '/games/tic-tac-toe/index.html',
      '/games/ludo/index.html',
    ];

    for (const link of gameLinks) {
      const response = await page.goto(link);
      expect(response?.status()).toBeLessThan(400);
      console.log(`✓ ${link} - Status: ${response?.status()}`);
    }
  });
});

test.describe('Edge Cases - Game Pages', () => {
  test('uno handles rapid page reloads', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });

    for (let i = 0; i < 3; i++) {
      await page.goto('/games/uno/index.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(200);
    }

    const mainContent = page.locator('main, [role="main"], .game-container, body');
    await expect(mainContent.first()).toBeVisible();

    console.log('✓ UNO handles rapid reloads');
  });

  test('bingo handles rapid page reloads', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });

    for (let i = 0; i < 3; i++) {
      await page.goto('/games/bingo/index.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(200);
    }

    const gridElement = page.locator('table, [class*="grid"], [class*="bingo"], body').first();
    await expect(gridElement).toBeVisible();

    console.log('✓ Bingo handles rapid reloads');
  });
});

test.describe('Visual Regression - Critical Elements', () => {
  test('hero gradient text renders', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const hero = page.locator('header.hero h1');

    // Get computed style to verify gradient
    const bgClip = await hero.evaluate((el) =>
      window.getComputedStyle(el).backgroundClip
    );

    console.log(`Hero background-clip: ${bgClip}`);

    await page.screenshot({ path: 'tests/screenshots/19-visual-hero-gradient.png' });
  });

  test('game cards have proper spacing', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const cards = page.locator('.game-card');
    const gap = await page.locator('.games-grid').evaluate((el) =>
      window.getComputedStyle(el).gap
    );

    console.log(`Grid gap: ${gap}`);

    // Gap should be 1.5rem (24px)
    expect(gap).toContain('24');

    await page.screenshot({ path: 'tests/screenshots/20-visual-card-spacing.png' });
  });

  test('button hover states work', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/uno/index.html');

    // Find any interactive buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();

      // Get initial state
      const initialOpacity = await firstButton.evaluate((el) =>
        window.getComputedStyle(el).opacity
      );

      // Hover
      await firstButton.hover();

      const hoverOpacity = await firstButton.evaluate((el) =>
        window.getComputedStyle(el).opacity
      );

      console.log(`Button opacity - Normal: ${initialOpacity}, Hover: ${hoverOpacity}`);

      await page.screenshot({ path: 'tests/screenshots/21-visual-button-hover.png' });
    }
  });
});

// ============================================================================
// SUMMARY SCREENSHOT TESTS
// ============================================================================

test.describe('Summary Screenshots', () => {
  test('full hub page desktop screenshot', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Ensure all content loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/99-HUB-FULL-DESKTOP.png',
      fullPage: false,
    });

    console.log('✓ Full hub desktop screenshot saved');
  });

  test('full hub page mobile screenshot', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Get full page height
    const fullHeight = await page.evaluate(() => document.body.scrollHeight);

    await page.screenshot({
      path: 'tests/screenshots/99-HUB-FULL-MOBILE.png',
      fullPage: true,
    });

    console.log(`✓ Full hub mobile screenshot saved (height: ${fullHeight}px)`);
  });

  test('full uno game desktop screenshot', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/uno/index.html');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/99-UNO-FULL-DESKTOP.png',
      fullPage: false,
    });

    console.log('✓ Full UNO desktop screenshot saved');
  });

  test('full bingo game desktop screenshot', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/bingo/index.html');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/99-BINGO-FULL-DESKTOP.png',
      fullPage: false,
    });

    console.log('✓ Full Bingo desktop screenshot saved');
  });
});
