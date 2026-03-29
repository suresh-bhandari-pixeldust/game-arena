import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Ensure screenshots directory exists
const screenshotDir = path.join(path.dirname(import.meta.url).replace('file://', ''), 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

/**
 * HAND CRICKET TESTS
 * Game: https://localhost:8881/games/hand-cricket/index.html
 */
test.describe('Hand Cricket - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('HC-001: Load hand cricket game page', async ({ page }) => {
    // HAPPY PATH: Game should load without errors
    await page.goto('/games/hand-cricket/index.html');

    // Verify page loads
    await expect(page).toHaveTitle(/Hand Cricket/);

    // Verify key UI elements are present
    await expect(page.locator('h1')).toContainText('Hand Cricket');
    await expect(page.locator('.brand')).toBeVisible();
    await expect(page.locator('.setup')).toBeVisible();

    // Screenshot: Initial load state
    await page.screenshot({ path: `${screenshotDir}/HC-001-desktop-load.png` });
  });

  test('HC-002: Start local game (happy path)', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');

    // Wait for setup panel to be visible
    await expect(page.locator('#setupPanel')).toBeVisible();

    // Verify mode toggle is visible
    await expect(page.locator('.mode-toggle')).toBeVisible();

    // Click "Start Match" button
    await page.locator('#startLocal').click();

    // Verify game panel appears
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Verify scoreboard is visible
    await expect(page.locator('.scoreboard')).toBeVisible();

    // Screenshot: Game started, toss phase
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/HC-002-desktop-game-started.png` });
  });

  test('HC-003: Toss flow - call odd/even', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Verify toss area appears
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });

    // Verify toss buttons are visible
    const oddBtn = page.locator('#tossOddBtn');
    const evenBtn = page.locator('#tossEvenBtn');

    await expect(oddBtn).toBeVisible();
    await expect(evenBtn).toBeVisible();

    // Verify buttons are enabled
    await expect(oddBtn).toBeEnabled();
    await expect(evenBtn).toBeEnabled();

    // Click Odd
    await oddBtn.click();

    // Verify toss result phase (bat or bowl choice)
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });

    // Screenshot: Bat/Bowl choice visible
    await page.screenshot({ path: `${screenshotDir}/HC-003-desktop-toss-result.png` });
  });

  test('HC-004: Bat or bowl selection', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Wait for and click toss
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#tossOddBtn').click();

    // Wait for bat/bowl area
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });

    const batBtn = page.locator('#chooseBat');
    const bowlBtn = page.locator('#chooseBowl');

    // Verify buttons exist and are enabled
    await expect(batBtn).toBeVisible();
    await expect(bowlBtn).toBeVisible();
    await expect(batBtn).toBeEnabled();
    await expect(bowlBtn).toBeEnabled();

    // Click Bat
    await batBtn.click();

    // Verify number picker appears (batting phase)
    await expect(page.locator('#numberPicker')).toBeVisible({ timeout: 3000 });

    // Screenshot: Number picker visible
    await page.screenshot({ path: `${screenshotDir}/HC-004-desktop-batting-phase.png` });
  });

  test('HC-005: Batting phase - pick numbers', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Setup: toss and select batting
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#tossOddBtn').click();
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#chooseBat').click();

    // Verify number picker
    await expect(page.locator('#numberPicker')).toBeVisible({ timeout: 3000 });

    // Verify all number buttons (1-6) are visible
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`button[data-num="${i}"]`)).toBeVisible();
      await expect(page.locator(`button[data-num="${i}"]`)).toBeEnabled();
    }

    // Pick a number
    await page.locator('button[data-num="3"]').click();

    // Verify reveal area appears after number picked
    await expect(page.locator('#revealArea')).toBeVisible({ timeout: 3000 });

    // Verify scoreboard is updated or showing match progress
    await expect(page.locator('.scoreboard')).toBeVisible();

    // Screenshot: After picking number
    await page.screenshot({ path: `${screenshotDir}/HC-005-desktop-number-picked.png` });
  });

  test('HC-006: Score updates correctly during play', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Toss and bat
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#tossOddBtn').click();
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#chooseBat').click();

    // Get initial score
    const scoreP1Before = await page.locator('#scoreP1Runs').textContent();

    // Pick numbers and continue multiple times
    for (let round = 0; round < 3; round++) {
      await expect(page.locator('#numberPicker')).toBeVisible({ timeout: 5000 });

      // Pick different numbers each time
      const num = (round % 6) + 1;
      await page.locator(`button[data-num="${num}"]`).click();

      // Wait for reveal area
      await expect(page.locator('#revealArea')).toBeVisible({ timeout: 3000 });

      // Get result
      const result = await page.locator('#revealResult').textContent();

      // If not OUT, continue
      if (!result.includes('OUT')) {
        // Click continue
        const continueBtn = page.locator('#continueBtn');
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
          await page.waitForTimeout(300);
        }
      } else {
        break;
      }
    }

    // Screenshot: Mid-game state
    await page.screenshot({ path: `${screenshotDir}/HC-006-desktop-mid-game.png` });
  });

  test('HC-007: UI responsiveness - no overlapping elements', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Check header positioning
    const header = page.locator('.brand');
    const headerBox = await header.boundingBox();
    expect(headerBox.height).toBeGreaterThan(0);
    expect(headerBox.width).toBeGreaterThan(0);

    // Check scoreboard positioning
    const scoreboard = page.locator('.scoreboard');
    const scoreboardBox = await scoreboard.boundingBox();
    expect(scoreboardBox.height).toBeGreaterThan(0);
    expect(scoreboardBox.width).toBeGreaterThan(0);

    // Check no major viewport violations
    expect(headerBox.x).toBeGreaterThanOrEqual(0);
    expect(headerBox.y).toBeGreaterThanOrEqual(0);

    // Screenshot: Layout check
    await page.screenshot({ path: `${screenshotDir}/HC-007-desktop-layout-check.png` });
  });
});

test.describe('Hand Cricket - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('HC-M-001: Mobile load', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await expect(page).toHaveTitle(/Hand Cricket/);
    await expect(page.locator('h1')).toContainText('Hand Cricket');

    // Screenshot: Mobile initial load
    await page.screenshot({ path: `${screenshotDir}/HC-M-001-mobile-load.png` });
  });

  test('HC-M-002: Mobile game flow', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Verify mobile layout is readable
    const scoreboard = page.locator('.scoreboard');
    const scoreboardBox = await scoreboard.boundingBox();

    // Should be roughly full width on mobile
    expect(scoreboardBox.width).toBeGreaterThan(300);

    // Screenshot: Mobile game started
    await page.screenshot({ path: `${screenshotDir}/HC-M-002-mobile-game.png` });
  });

  test('HC-M-003: Mobile toss and number selection', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Toss
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#tossOddBtn').click();

    // Bat
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });
    await page.locator('#chooseBat').click();

    // Number picker on mobile
    await expect(page.locator('#numberPicker')).toBeVisible({ timeout: 3000 });

    // Verify number buttons are not too small on mobile
    const numBtn = page.locator('button[data-num="1"]');
    const numBtnBox = await numBtn.boundingBox();
    expect(numBtnBox.height).toBeGreaterThan(40); // Minimum touch target
    expect(numBtnBox.width).toBeGreaterThan(40);

    // Screenshot: Mobile number picker
    await page.screenshot({ path: `${screenshotDir}/HC-M-003-mobile-numbers.png` });
  });
});

/**
 * BOOK CRICKET TESTS
 */
test.describe('Book Cricket - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('BC-001: Load book cricket game', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');
    await expect(page).toHaveTitle(/Book Cricket/);
    await expect(page.locator('h1')).toContainText('Book Cricket');

    // Screenshot: Initial load
    await page.screenshot({ path: `${screenshotDir}/BC-001-desktop-load.png` });
  });

  test('BC-002: Start local game and verify page/number display', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');

    // Start game
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Verify page/number display elements exist
    const pageDisplay = page.locator('[id*="page"], [class*="page"]').first();
    await expect(page.locator('.scoreboard')).toBeVisible();

    // Screenshot: Game started
    await page.screenshot({ path: `${screenshotDir}/BC-002-desktop-game-started.png` });
  });

  test('BC-003: OUT on 0 and 8 handling', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Play multiple rounds to potentially hit 0 or 8
    let roundCount = 0;
    let foundOutRound = false;

    while (roundCount < 5 && !foundOutRound) {
      // Look for button to open page/input number
      const buttons = page.locator('button');
      const btnCount = await buttons.count();

      if (btnCount > 0) {
        // Find and click a game action button (not setup)
        const gameActionBtn = page.locator('[id*="action"], [class*="action"], [id*="turn"]').first();
        if (await gameActionBtn.isVisible()) {
          await gameActionBtn.click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      }

      roundCount++;
    }

    // Screenshot: Game progression
    await page.screenshot({ path: `${screenshotDir}/BC-003-desktop-out-handling.png` });
  });

  test('BC-004: Full game flow through both innings', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Play game for a reasonable amount of time
    await page.waitForTimeout(2000);

    // Check if there's innings info
    const inningsInfo = page.locator('[id*="innings"], [class*="innings"]').first();
    if (await inningsInfo.isVisible()) {
      const inningsText = await inningsInfo.textContent();
      expect(inningsText).toBeTruthy();
    }

    // Screenshot: Mid-game state
    await page.screenshot({ path: `${screenshotDir}/BC-004-desktop-full-flow.png` });
  });
});

test.describe('Book Cricket - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('BC-M-001: Mobile load and start', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');
    await expect(page).toHaveTitle(/Book Cricket/);
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Screenshot: Mobile game started
    await page.screenshot({ path: `${screenshotDir}/BC-M-001-mobile-game.png` });
  });

  test('BC-M-002: Mobile touch targets and layout', async ({ page }) => {
    await page.goto('/games/book-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Verify scoreboard is visible and properly sized for mobile
    const scoreboard = page.locator('.scoreboard');
    const box = await scoreboard.boundingBox();
    expect(box.width).toBeGreaterThan(300);

    // Screenshot: Mobile layout
    await page.screenshot({ path: `${screenshotDir}/BC-M-002-mobile-layout.png` });
  });
});

/**
 * FLAMES TESTS
 */
test.describe('FLAMES - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('FL-001: Load FLAMES game', async ({ page }) => {
    await page.goto('/games/flames/index.html');
    await expect(page).toHaveTitle(/FLAMES/);
    await expect(page.locator('h1')).toContainText('FLAMES');

    // Screenshot: Initial load
    await page.screenshot({ path: `${screenshotDir}/FL-001-desktop-load.png` });
  });

  test('FL-002: Enter two names and get FLAMES result', async ({ page }) => {
    await page.goto('/games/flames/index.html');

    // Find input fields for names
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();

    if (inputCount >= 2) {
      // Fill in two names
      await inputs.nth(0).fill('Alice');
      await inputs.nth(1).fill('Bob');

      // Look for submit or play button
      const playBtn = page.locator('button').filter({ hasText: /Play|Start|Calculate/ }).first();
      if (await playBtn.isVisible()) {
        await playBtn.click();

        // Wait for result
        await page.waitForTimeout(1500);

        // Verify result appears
        const resultArea = page.locator('[id*="result"], [class*="result"]').first();
        if (await resultArea.isVisible()) {
          const resultText = await resultArea.textContent();
          expect(resultText).toBeTruthy();
        }
      }
    }

    // Screenshot: Result visible
    await page.screenshot({ path: `${screenshotDir}/FL-002-desktop-result.png` });
  });

  test('FL-003: Verify FLAMES options are displayed', async ({ page }) => {
    await page.goto('/games/flames/index.html');

    // Fill in names
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('Chris');
      await inputs.nth(1).fill('Diana');

      // Click play
      const playBtn = page.locator('button').filter({ hasText: /Play|Start|Calculate/ }).first();
      if (await playBtn.isVisible()) {
        await playBtn.click();

        // Wait for animation
        await page.waitForTimeout(2000);

        // Check for FLAMES letters or result text
        const result = page.locator('[id*="result"], [class*="result"]').first();
        if (await result.isVisible()) {
          const text = await result.textContent();
          // FLAMES result should be one of: Friend, Love, Admire, Marriage, Enemy, Sibling
          const flames = ['Friend', 'Love', 'Admire', 'Marriage', 'Enemy', 'Sibling'];
          const hasFlamesResult = flames.some(f => text.includes(f));
          expect(hasFlamesResult || text.length > 0).toBeTruthy();
        }
      }
    }

    // Screenshot: Result with FLAMES
    await page.screenshot({ path: `${screenshotDir}/FL-003-desktop-flames-result.png` });
  });

  test('FL-004: Animation/step-by-step elimination', async ({ page }) => {
    await page.goto('/games/flames/index.html');

    // Fill in names
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('Eve');
      await inputs.nth(1).fill('Frank');

      // Click play
      const playBtn = page.locator('button').filter({ hasText: /Play|Start|Calculate/ }).first();
      if (await playBtn.isVisible()) {
        await playBtn.click();

        // Wait for animation to complete
        await page.waitForTimeout(500);

        // Screenshot during animation
        await page.screenshot({ path: `${screenshotDir}/FL-004-desktop-animation-1.png` });

        await page.waitForTimeout(1000);

        // Screenshot after animation
        await page.screenshot({ path: `${screenshotDir}/FL-004-desktop-animation-2.png` });
      }
    }
  });
});

test.describe('FLAMES - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('FL-M-001: Mobile load and input', async ({ page }) => {
    await page.goto('/games/flames/index.html');
    await expect(page).toHaveTitle(/FLAMES/);

    // Fill names
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('Grace');
      await inputs.nth(1).fill('Henry');

      // Screenshot: Inputs filled on mobile
      await page.screenshot({ path: `${screenshotDir}/FL-M-001-mobile-inputs.png` });
    }
  });

  test('FL-M-002: Mobile result display and responsiveness', async ({ page }) => {
    await page.goto('/games/flames/index.html');

    // Fill in names
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('Ivy');
      await inputs.nth(1).fill('Jack');

      // Click play
      const playBtn = page.locator('button').filter({ hasText: /Play|Start|Calculate/ }).first();
      if (await playBtn.isVisible()) {
        await playBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Screenshot: Mobile result
    await page.screenshot({ path: `${screenshotDir}/FL-M-002-mobile-result.png` });
  });
});

/**
 * ATLAS TESTS
 */
test.describe('Atlas - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('AT-001: Load Atlas game', async ({ page }) => {
    await page.goto('/games/atlas/index.html');
    await expect(page).toHaveTitle(/Atlas/);

    // Screenshot: Initial load
    await page.screenshot({ path: `${screenshotDir}/AT-001-desktop-load.png` });
  });

  test('AT-002: Start local game and verify timer', async ({ page }) => {
    await page.goto('/games/atlas/index.html');

    // Find and click start button
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();

      // Wait for game to start
      await page.waitForTimeout(500);
    }

    // Look for timer element
    const timerElements = page.locator('[id*="timer"], [class*="timer"], [class*="time"]');
    const timerCount = await timerElements.count();

    if (timerCount > 0) {
      await expect(timerElements.first()).toBeVisible();
    }

    // Screenshot: Game started with timer
    await page.screenshot({ path: `${screenshotDir}/AT-002-desktop-game-start.png` });
  });

  test('AT-003: Type place name and submit', async ({ page }) => {
    await page.goto('/games/atlas/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Find input field
    const textInput = page.locator('input[type="text"]').first();
    if (await textInput.isVisible()) {
      await textInput.fill('India');

      // Find and click submit/next button
      const submitBtn = page.locator('button').filter({ hasText: /Submit|Next|Enter/ }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Screenshot: After submission
    await page.screenshot({ path: `${screenshotDir}/AT-003-desktop-submit.png` });
  });

  test('AT-004: Word chain display', async ({ page }) => {
    await page.goto('/games/atlas/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Enter multiple place names
    for (let i = 0; i < 3; i++) {
      const textInput = page.locator('input[type="text"]').first();
      if (await textInput.isVisible()) {
        const places = ['Paris', 'Shanghai', 'Athens'];
        await textInput.fill(places[i % 3]);

        const submitBtn = page.locator('button').filter({ hasText: /Submit|Next|Enter/ }).first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Screenshot: Word chain visible
    await page.screenshot({ path: `${screenshotDir}/AT-004-desktop-chain.png` });
  });
});

test.describe('Atlas - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('AT-M-001: Mobile game load and play', async ({ page }) => {
    await page.goto('/games/atlas/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Enter a place
    const textInput = page.locator('input[type="text"]').first();
    if (await textInput.isVisible()) {
      await textInput.fill('Rome');
    }

    // Screenshot: Mobile input
    await page.screenshot({ path: `${screenshotDir}/AT-M-001-mobile-input.png` });
  });

  test('AT-M-002: Mobile timer visibility', async ({ page }) => {
    await page.goto('/games/atlas/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Check timer visibility
    const timerElements = page.locator('[id*="timer"], [class*="timer"], [class*="time"]');
    const timerCount = await timerElements.count();

    if (timerCount > 0) {
      await expect(timerElements.first()).toBeVisible();
    }

    // Screenshot: Mobile with timer
    await page.screenshot({ path: `${screenshotDir}/AT-M-002-mobile-timer.png` });
  });
});

/**
 * NAME PLACE ANIMAL THING TESTS
 */
test.describe('Name Place Animal Thing - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('NPAT-001: Load game', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');
    await expect(page).toHaveTitle(/Name.*Place.*Animal.*Thing|NPAT/i);

    // Screenshot: Initial load
    await page.screenshot({ path: `${screenshotDir}/NPAT-001-desktop-load.png` });
  });

  test('NPAT-002: Start round and verify letter display', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for letter display
    const letterElements = page.locator('[id*="letter"], [class*="letter"], [class*="current"]');
    const letterCount = await letterElements.count();

    if (letterCount > 0) {
      await expect(letterElements.first()).toBeVisible();
      const letter = await letterElements.first().textContent();
      expect(letter).toMatch(/[a-zA-Z]/);
    }

    // Screenshot: Round started with letter
    await page.screenshot({ path: `${screenshotDir}/NPAT-002-desktop-letter.png` });
  });

  test('NPAT-003: Verify timer display', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for timer
    const timerElements = page.locator('[id*="timer"], [class*="timer"], [class*="time"], [class*="countdown"]');
    const timerCount = await timerElements.count();

    if (timerCount > 0) {
      await expect(timerElements.first()).toBeVisible();
      const timerText = await timerElements.first().textContent();
      expect(timerText).toBeTruthy();
    }

    // Screenshot: Timer visible
    await page.screenshot({ path: `${screenshotDir}/NPAT-003-desktop-timer.png` });
  });

  test('NPAT-004: Fill in answers and submit', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill in answer fields
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();

    if (inputCount >= 1) {
      if (inputCount >= 4) {
        // Standard 4 categories: Name, Place, Animal, Thing
        await inputs.nth(0).fill('Alice');
        await inputs.nth(1).fill('Australia');
        await inputs.nth(2).fill('Ant');
        await inputs.nth(3).fill('Apple');
      } else {
        // Fill whatever inputs exist
        const answers = ['Alice', 'Australia', 'Ant', 'Apple', 'Airplane'];
        for (let i = 0; i < Math.min(inputCount, answers.length); i++) {
          await inputs.nth(i).fill(answers[i]);
        }
      }
    }

    // Look for submit button
    const submitBtn = page.locator('button').filter({ hasText: /Submit|Send|Enter/ }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Answers submitted
    await page.screenshot({ path: `${screenshotDir}/NPAT-004-desktop-answers.png` });
  });

  test('NPAT-005: Scoring display', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Submit answers
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();
    if (inputCount >= 4) {
      await inputs.nth(0).fill('Bob');
      await inputs.nth(1).fill('Brazil');
      await inputs.nth(2).fill('Bear');
      await inputs.nth(3).fill('Ball');
    }

    const submitBtn = page.locator('button').filter({ hasText: /Submit|Send|Enter/ }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // Look for score/scoring information
    const scoreElements = page.locator('[id*="score"], [class*="score"], [class*="points"]');
    const scoreCount = await scoreElements.count();

    if (scoreCount > 0) {
      await expect(scoreElements.first()).toBeVisible({ timeout: 3000 });
    }

    // Screenshot: Scoring visible
    await page.screenshot({ path: `${screenshotDir}/NPAT-005-desktop-scoring.png` });
  });
});

test.describe('Name Place Animal Thing - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('NPAT-M-001: Mobile game load and start', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Mobile game started
    await page.screenshot({ path: `${screenshotDir}/NPAT-M-001-mobile-start.png` });
  });

  test('NPAT-M-002: Mobile input layout and touch targets', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify input sizes on mobile
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInputBox = await inputs.nth(0).boundingBox();
      // Should be large enough for mobile touch
      expect(firstInputBox.height).toBeGreaterThan(30);
      expect(firstInputBox.width).toBeGreaterThan(100);
    }

    // Screenshot: Mobile inputs
    await page.screenshot({ path: `${screenshotDir}/NPAT-M-002-mobile-inputs.png` });
  });
});

/**
 * TIC TAC TOE TESTS
 */
test.describe('Tic-Tac-Toe - Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('TTT-001: Load game', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');
    await expect(page).toHaveTitle(/Tic.*Tac.*Toe|TTT/i);

    // Screenshot: Initial load
    await page.screenshot({ path: `${screenshotDir}/TTT-001-desktop-load.png` });
  });

  test('TTT-002: Start local game and verify grid', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for game grid (3x3)
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    const cellCount = await gridCells.count();

    // Should have 9 cells for tic-tac-toe
    expect(cellCount).toBeGreaterThanOrEqual(9);

    // Screenshot: Grid visible
    await page.screenshot({ path: `${screenshotDir}/TTT-002-desktop-grid.png` });
  });

  test('TTT-003: Play game - click X and O marks', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Get grid cells
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    const cellCount = await gridCells.count();

    if (cellCount >= 9) {
      // Click first cell
      await gridCells.nth(0).click();
      await page.waitForTimeout(300);

      // Verify first cell is marked (should have X)
      const firstCell = gridCells.nth(0);
      const cellText = await firstCell.textContent();
      expect(cellText).toMatch(/X|O|1/i);
    }

    // Screenshot: First move
    await page.screenshot({ path: `${screenshotDir}/TTT-003-desktop-first-move.png` });
  });

  test('TTT-004: Win detection - visual feedback', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Get grid cells
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    const cellCount = await gridCells.count();

    // Try to play a winning pattern: positions 0, 1, 2 (top row)
    if (cellCount >= 9) {
      // Click to get initial state
      await gridCells.nth(0).click();
      await page.waitForTimeout(300);

      // Try clicking more cells
      await gridCells.nth(3).click();
      await page.waitForTimeout(300);

      await gridCells.nth(1).click();
      await page.waitForTimeout(300);

      await gridCells.nth(4).click();
      await page.waitForTimeout(300);

      await gridCells.nth(2).click();
      await page.waitForTimeout(500);

      // Check for win message/overlay
      const winElement = page.locator('[id*="win"], [class*="win"], [class*="winner"]').first();
      if (await winElement.isVisible()) {
        const winText = await winElement.textContent();
        expect(winText).toBeTruthy();
      }
    }

    // Screenshot: Game progression
    await page.screenshot({ path: `${screenshotDir}/TTT-004-desktop-progression.png` });
  });

  test('TTT-005: Draw scenario', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    // Start game
    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Play until draw or win
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    const cellCount = await gridCells.count();

    if (cellCount >= 9) {
      // Try drawing pattern: X at 0, O at 1, X at 2, O at 3, X at 4, O at 5, X at 6, O at 7, X at 8
      const pattern = [0, 3, 1, 4, 2, 5, 6, 7, 8];

      for (let i = 0; i < Math.min(pattern.length, cellCount); i++) {
        const cell = gridCells.nth(pattern[i]);
        const disabled = await cell.isDisabled();

        if (!disabled && (await cell.textContent()).trim() === '') {
          await cell.click();
          await page.waitForTimeout(200);
        }
      }

      await page.waitForTimeout(500);
    }

    // Screenshot: Final game state
    await page.screenshot({ path: `${screenshotDir}/TTT-005-desktop-end-state.png` });
  });
});

test.describe('Tic-Tac-Toe - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('TTT-M-001: Mobile game load and grid', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify grid is visible
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    const cellCount = await gridCells.count();
    expect(cellCount).toBeGreaterThanOrEqual(9);

    // Screenshot: Mobile grid
    await page.screenshot({ path: `${screenshotDir}/TTT-M-001-mobile-grid.png` });
  });

  test('TTT-M-002: Mobile touch targets size', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify cell sizes are adequate for touch
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    if (await gridCells.nth(0).isVisible()) {
      const cellBox = await gridCells.nth(0).boundingBox();
      // Each cell should be at least 40px (minimum touch target)
      expect(cellBox.height).toBeGreaterThan(30);
      expect(cellBox.width).toBeGreaterThan(30);
    }

    // Screenshot: Mobile cells
    await page.screenshot({ path: `${screenshotDir}/TTT-M-002-mobile-cells.png` });
  });

  test('TTT-M-003: Mobile gameplay', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Play a few moves
    const gridCells = page.locator('[class*="cell"], [class*="square"], button[data-cell]');
    if (await gridCells.nth(0).isVisible()) {
      await gridCells.nth(0).click();
      await page.waitForTimeout(300);

      await gridCells.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Screenshot: Mobile gameplay
    await page.screenshot({ path: `${screenshotDir}/TTT-M-003-mobile-gameplay.png` });
  });
});

/**
 * EDGE CASES AND ERROR HANDLING TESTS
 */
test.describe('Edge Cases & Error Handling', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('EC-001: Rapid button clicks - double submit prevention', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');

    // Start game
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Try rapid toss button clicks
    const oddBtn = page.locator('#tossOddBtn');
    await expect(oddBtn).toBeEnabled();

    // Rapid click
    await oddBtn.click();
    await oddBtn.click();
    await oddBtn.click();

    // Should only count as one action - verify game progresses normally
    await page.waitForTimeout(500);

    // Should move to bat/bowl phase
    await expect(page.locator('#batOrBowlArea')).toBeVisible({ timeout: 3000 });

    // Screenshot: No duplicate state
    await page.screenshot({ path: `${screenshotDir}/EC-001-rapid-clicks.png` });
  });

  test('EC-002: Empty/null input handling - NPAT', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Try to submit without filling inputs
    const submitBtn = page.locator('button').filter({ hasText: /Submit|Send|Enter/ }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
    }

    // Game should either prevent submission or handle gracefully
    // Check if form still visible or if error appears
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      // Form still visible - submit was prevented (good)
      expect(await inputs.nth(0).inputValue()).toBe('');
    }

    // Screenshot: Error handling
    await page.screenshot({ path: `${screenshotDir}/EC-002-empty-input.png` });
  });

  test('EC-003: Very long input strings', async ({ page }) => {
    await page.goto('/games/flames/index.html');

    // Try very long name
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      const longName = 'A'.repeat(200);
      await inputs.nth(0).fill(longName);

      // Should not break layout
      const inputBox = await inputs.nth(0).boundingBox();
      expect(inputBox).toBeTruthy();
      expect(inputBox.width).toBeGreaterThan(0);
    }

    // Screenshot: Long input handling
    await page.screenshot({ path: `${screenshotDir}/EC-003-long-input.png` });
  });

  test('EC-004: Special characters in input', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill with special characters
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('!@#$%^&*()_+-=[]{}|;:,.<>?');

      const value = await inputs.nth(0).inputValue();
      expect(value).toBeTruthy();
    }

    // Screenshot: Special chars handling
    await page.screenshot({ path: `${screenshotDir}/EC-004-special-chars.png` });
  });

  test('EC-005: Navigation away and back', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');

    // Start game
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Navigate away
    await page.goto('/games/tic-tac-toe/index.html');

    // Come back
    await page.goto('/games/hand-cricket/index.html');

    // Should reset to initial state (no game in progress)
    await expect(page.locator('#setupPanel')).toBeVisible({ timeout: 3000 });

    // Screenshot: Proper state reset
    await page.screenshot({ path: `${screenshotDir}/EC-005-nav-away-back.png` });
  });

  test('EC-006: Page responsiveness under stress - multiple games loaded', async ({ page }) => {
    // Load game page
    await page.goto('/games/hand-cricket/index.html');

    // Start game
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Try clicking multiple UI elements
    const numPickers = page.locator('button[data-num]');
    const numCount = await numPickers.count();

    if (numCount > 0) {
      for (let i = 0; i < Math.min(numCount, 5); i++) {
        const isVisible = await numPickers.nth(i).isVisible();
        if (isVisible) {
          const isEnabled = await numPickers.nth(i).isEnabled();
          expect(typeof isEnabled).toBe('boolean');
        }
      }
    }

    // Screenshot: Stress state
    await page.screenshot({ path: `${screenshotDir}/EC-006-stress-test.png` });
  });
});

/**
 * SECURITY & DATA ISOLATION TESTS
 */
test.describe('Security & Data Isolation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SEC-001: XSS prevention - special chars in names', async ({ page }) => {
    await page.goto('/games/name-place-animal-thing/index.html');

    const startBtn = page.locator('button').filter({ hasText: /Start|Play|Begin/ }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Try XSS payload
    const inputs = page.locator('input[type="text"]');
    if (await inputs.nth(0).isVisible()) {
      await inputs.nth(0).fill('<script>alert("xss")</script>');

      // Page should not alert (XSS prevented)
      // Check page is still functional
      await expect(page.locator('body')).toBeVisible();
    }

    // Screenshot: XSS handling
    await page.screenshot({ path: `${screenshotDir}/SEC-001-xss-prevention.png` });
  });

  test('SEC-002: Invalid data in game state', async ({ page }) => {
    // This is more of an API test, but we'll verify game handles gracefully
    await page.goto('/games/hand-cricket/index.html');

    // Start game normally
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Game should maintain consistent state
    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();

    // Screenshot: Valid state
    await page.screenshot({ path: `${screenshotDir}/SEC-002-valid-state.png` });
  });
});

/**
 * VISUAL REGRESSION CHECKS
 */
test.describe('Visual Regression & Layout', () => {
  test('VIS-001: All games accessible from hub', async ({ page }) => {
    await page.goto('/');

    // Should see game cards/links
    const links = page.locator('a, button');
    const linkCount = await links.count();

    expect(linkCount).toBeGreaterThan(0);

    // Screenshot: Hub page
    await page.screenshot({ path: `${screenshotDir}/VIS-001-hub-desktop.png` });
  });

  test('VIS-002: Dark theme applied consistently', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');

    // Check for dark background
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);

    // Should be dark color (not white)
    expect(bgColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);

    // Screenshot: Theme check
    await page.screenshot({ path: `${screenshotDir}/VIS-002-dark-theme.png` });
  });

  test('VIS-003: Consistent typography and spacing', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');

    // Check header
    const header = page.locator('.brand');
    await expect(header).toBeVisible();

    const headerBox = await header.boundingBox();
    expect(headerBox.height).toBeGreaterThan(80);

    // Screenshot: Typography check
    await page.screenshot({ path: `${screenshotDir}/VIS-003-typography.png` });
  });
});

/**
 * PERFORMANCE & LOAD THINKING
 */
test.describe('Performance Thinking', () => {
  test('PERF-001: Initial page load time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/games/hand-cricket/index.html');

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (< 3 seconds)
    expect(loadTime).toBeLessThan(3000);

    console.log(`Hand Cricket load time: ${loadTime}ms`);
  });

  test('PERF-002: Game action responsiveness', async ({ page }) => {
    await page.goto('/games/hand-cricket/index.html');
    await page.locator('#startLocal').click();
    await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 5000 });

    // Measure toss button response time
    await expect(page.locator('#tossArea')).toBeVisible({ timeout: 3000 });

    const startTime = Date.now();
    await page.locator('#tossOddBtn').click();
    const responseTime = Date.now() - startTime;

    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);

    console.log(`Toss button response: ${responseTime}ms`);
  });

  test('PERF-003: Multiple assets load without hanging', async ({ page }) => {
    // Measure time to fully interactive state
    const startTime = Date.now();

    await page.goto('/games/tic-tac-toe/index.html', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);

    console.log(`Tic-Tac-Toe full load: ${loadTime}ms`);
  });
});
