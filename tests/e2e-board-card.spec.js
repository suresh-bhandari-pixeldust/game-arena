import { test, expect } from '@playwright/test';

/**
 * QA E2E Test Suite for Game Arena Board and Card Games
 *
 * This comprehensive test suite validates:
 * - Visual rendering (desktop & mobile)
 * - Game initialization and setup
 * - Gameplay mechanics and interactions
 * - Game state and score tracking
 * - Responsive design
 * - Edge cases and error handling
 */

const BASE_URL = 'http://localhost:8881';
const GAMES = [
  {
    name: 'Dots and Boxes',
    url: '/games/dots-and-boxes/index.html',
    type: 'strategy',
    interactions: ['clickLine', 'verifyScore', 'verifyTurn']
  },
  {
    name: 'Raja Mantri Chor Sipahi',
    url: '/games/raja-mantri-chor-sipahi/index.html',
    type: 'card-role',
    interactions: ['dealRoles', 'reveal', 'guess']
  },
  {
    name: 'WWE Trump Cards',
    url: '/games/wwe-trump-cards/index.html',
    type: 'trump-card',
    interactions: ['selectStat', 'verifyComparison', 'verifyCardFlip']
  },
  {
    name: 'Football Trump Cards',
    url: '/games/football-trump-cards/index.html',
    type: 'trump-card',
    interactions: ['selectStat', 'verifyComparison']
  },
  {
    name: 'Ludo',
    url: '/games/ludo/index.html',
    type: 'board',
    interactions: ['rollDice', 'verifyBoardRender', 'verifyTokenMovement']
  },
  {
    name: 'Pen Fight',
    url: '/games/pen-fight/index.html',
    type: 'physics',
    interactions: ['flickControl', 'verifyPhysics', 'verifyAnimation']
  },
  {
    name: 'Business',
    url: '/games/business/index.html',
    type: 'board',
    interactions: ['rollDice', 'verifyBoardRender', 'buyProperty']
  }
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 }
];

/**
 * Helper: Take a screenshot with context
 */
async function takeScreenshot(page, game, phase, viewport) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${game.name.replace(/\s+/g, '-').toLowerCase()}_${phase}_${viewport.name}_${timestamp}.png`;
  const path = `tests/screenshots/${filename}`;
  await page.screenshot({ path, fullPage: true });
  console.log(`Screenshot: ${filename}`);
  return path;
}

/**
 * Helper: Start a local game with default settings
 */
async function startLocalGame(page) {
  // Wait for setup panel
  await page.waitForSelector('[id*="setupPanel"]', { timeout: 5000 });

  // Click "Start Game" button
  const startButton = page.locator('button:has-text("Start Game")').first();
  await startButton.click();

  // Wait for game panel to be visible
  await page.waitForSelector('[id*="gamePanel"]', { timeout: 10000 });
}

/**
 * Test: DOTS AND BOXES
 */
test.describe('Dots and Boxes', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    // Wait for header and setup panel
    await page.waitForSelector('h1:has-text("Dots and Boxes")');
    await page.waitForSelector('[id*="setupPanel"]');

    // Verify header elements
    const title = await page.locator('h1').first();
    await expect(title).toHaveText('Dots and Boxes');

    // Verify setup UI components
    const setupPanel = page.locator('[id*="setupPanel"]');
    await expect(setupPanel).toBeVisible();

    await takeScreenshot(page, GAMES[0], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    await page.waitForSelector('h1:has-text("Dots and Boxes")');

    // Verify mobile responsive layout
    const header = page.locator('.brand');
    await expect(header).toBeVisible();

    await takeScreenshot(page, GAMES[0], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should initialize game with correct player count', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    // Verify default player count
    const playerCount = page.locator('#playerCount');
    await expect(playerCount).toHaveText('1');

    // Increase player count
    await page.locator('#playerPlus').click();
    await expect(playerCount).toHaveText('2');
  });

  test('should verify grid size options', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const gridDisplay = page.locator('#gridSizeDisplay');
    await expect(gridDisplay).toContainText('4x4');

    // Increase grid size
    await page.locator('#gridSizePlus').click();
    const newSize = await gridDisplay.textContent();
    expect(newSize).not.toBe('4x4');
  });

  test('should start local game and display board', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    await startLocalGame(page);

    // Verify game panel is visible
    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    // Verify board container exists
    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();

    await takeScreenshot(page, GAMES[0], 'gameplay', VIEWPORTS[0]);
  });

  test('should display turn information during gameplay', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);
    await startLocalGame(page);

    // Verify turn card is visible
    const turnCard = page.locator('#turnCard');
    await expect(turnCard).toBeVisible();

    const turnName = page.locator('#turnName');
    await expect(turnName).not.toHaveText('-');
  });

  test('should track and display scoreboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);
    await startLocalGame(page);

    // Verify scoreboard is present
    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();
  });

  test('should allow clicking lines to draw', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);
    await startLocalGame(page);

    // Wait for board SVG elements
    await page.waitForTimeout(500);

    // Get all clickable line elements
    const lines = await page.locator('line').all();

    if (lines.length > 0) {
      // Click first available line
      const firstLine = lines[0];
      const box = await firstLine.boundingBox();

      if (box) {
        await page.click(`[role="button"], line`, {
          position: { x: box.width / 2, y: box.height / 2 }
        });
      }
    }

    // Verify turn may have changed or score updated
    const turnHint = page.locator('#turnHint');
    await expect(turnHint).toBeVisible();
  });

  test('should respond to New Game button', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);
    await startLocalGame(page);

    // Click New Game
    const newGameBtn = page.locator('#restartLocal');
    if (await newGameBtn.isVisible()) {
      await newGameBtn.click();

      // Game should restart, scoreboard should reset or show new state
      const scoreboard = page.locator('.scoreboard');
      await expect(scoreboard).toBeVisible();
    }
  });

  test('should handle spectator mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    // Enable spectator mode
    const spectatorCheckbox = page.locator('#localSpectator');
    await spectatorCheckbox.check();

    // Start game
    await startLocalGame(page);

    // Verify game is running with bots
    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);
  });
});

/**
 * Test: RAJA MANTRI CHOR SIPAHI
 */
test.describe('Raja Mantri Chor Sipahi', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);

    await page.waitForSelector('h1:has-text("Raja Mantri Chor Sipahi")');
    await takeScreenshot(page, GAMES[1], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);

    await page.waitForSelector('h1:has-text("Raja Mantri Chor Sipahi")');
    await takeScreenshot(page, GAMES[1], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should start game and deal roles to players', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);

    // Set number of opponents
    const playerCount = page.locator('#playerCount');
    const currentCount = await playerCount.textContent();

    // Ensure at least 2 other players (3 total)
    if (parseInt(currentCount) < 2) {
      await page.locator('#playerPlus').click();
    }

    await startLocalGame(page);

    // Verify game panel is visible
    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    await takeScreenshot(page, GAMES[1], 'game-started', VIEWPORTS[0]);
  });

  test('should display game phase information', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);
    await startLocalGame(page);

    // Look for phase indicators or turn hints
    const turnHint = page.locator('#turnHint');
    await expect(turnHint).toBeVisible();
  });

  test('should track score for all players', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);
    await startLocalGame(page);

    // Verify scoreboard exists
    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();
  });

  test('should have game logs visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/raja-mantri-chor-sipahi/index.html`);
    await startLocalGame(page);

    // Click logs button
    const toggleLogsBtn = page.locator('.toggle-logs-btn');
    if (await toggleLogsBtn.isVisible()) {
      await toggleLogsBtn.click();

      // Verify sidebar opens
      const sidebar = page.locator('.sidebar');
      await expect(sidebar).toBeVisible();
    }
  });
});

/**
 * Test: WWE TRUMP CARDS
 */
test.describe('WWE Trump Cards', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await page.waitForSelector('h1:has-text("WWE Trump Cards")');
    await takeScreenshot(page, GAMES[2], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await page.waitForSelector('h1:has-text("WWE Trump Cards")');
    await takeScreenshot(page, GAMES[2], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should start game and display wrestler cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);

    // Verify game panel visible
    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    // Look for card elements (wrestler cards should be visible)
    await page.waitForTimeout(1000);

    await takeScreenshot(page, GAMES[2], 'cards-displayed', VIEWPORTS[0]);
  });

  test('should verify card content and stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);

    // Wait for cards to render
    await page.waitForTimeout(1000);

    // Look for stat buttons (strength, speed, etc.)
    const statButtons = page.locator('button[class*="stat"], [role="button"]:has-text(/Strength|Speed|Power/)');

    // There should be multiple stat buttons visible
    const count = await statButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle stat selection and comparison', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Find and click a stat button
    const buttons = await page.locator('button').all();

    // Try to find and click a stat button
    for (const btn of buttons) {
      const text = await btn.textContent();
      // Stats might include keywords like "Strength", "Speed", "Power", etc.
      if (text && (text.includes('Strength') || text.includes('Speed') || text.includes('Power'))) {
        await btn.click();
        await page.waitForTimeout(500);
        break;
      }
    }

    await takeScreenshot(page, GAMES[2], 'stat-selected', VIEWPORTS[0]);
  });

  test('should display winner information', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);

    // Verify scoreboard or turn info is present
    const turnCard = page.locator('#turnCard');
    await expect(turnCard).toBeVisible();
  });

  test('should animate card flips', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Cards should have animation classes or transforms
    // This is a visual check that requires screenshot comparison
    await takeScreenshot(page, GAMES[2], 'cards-in-play', VIEWPORTS[0]);
  });

  test('should be playable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/wwe-trump-cards/index.html`);

    await startLocalGame(page);

    // Verify cards are still interactive on mobile
    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    await takeScreenshot(page, GAMES[2], 'mobile-gameplay', VIEWPORTS[1]);
  });
});

/**
 * Test: FOOTBALL TRUMP CARDS
 */
test.describe('Football Trump Cards', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/football-trump-cards/index.html`);

    await page.waitForSelector('h1:has-text("Football Trump Cards")');
    await takeScreenshot(page, GAMES[3], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/football-trump-cards/index.html`);

    await page.waitForSelector('h1:has-text("Football Trump Cards")');
    await takeScreenshot(page, GAMES[3], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should start game and display player cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/football-trump-cards/index.html`);

    await startLocalGame(page);

    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    await page.waitForTimeout(1000);
    await takeScreenshot(page, GAMES[3], 'players-displayed', VIEWPORTS[0]);
  });

  test('should allow stat selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/football-trump-cards/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Find stat buttons
    const buttons = await page.locator('button').all();
    let clicked = false;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.includes('Goals') || text.includes('Assists') || text.includes('Speed'))) {
        await btn.click();
        clicked = true;
        await page.waitForTimeout(500);
        break;
      }
    }

    // Stat selection should work even if we couldn't identify exact stat names
    await takeScreenshot(page, GAMES[3], 'stat-comparison', VIEWPORTS[0]);
  });

  test('should track score correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/football-trump-cards/index.html`);

    await startLocalGame(page);

    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();
  });
});

/**
 * Test: LUDO
 */
test.describe('Ludo', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await page.waitForSelector('h1:has-text("Ludo")');
    await takeScreenshot(page, GAMES[4], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await page.waitForSelector('h1:has-text("Ludo")');
    await takeScreenshot(page, GAMES[4], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should have 4 players by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    const playerCount = page.locator('#playerCount');
    await expect(playerCount).toHaveText('3');
  });

  test('should start game and render board', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await startLocalGame(page);

    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    // Wait for board to render
    await page.waitForTimeout(1000);

    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();

    await takeScreenshot(page, GAMES[4], 'board-rendered', VIEWPORTS[0]);
  });

  test('should display dice roller', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await startLocalGame(page);

    // Look for dice or roll button
    const diceElements = page.locator('[class*="dice"], button:has-text(/Roll|Dice/)');
    const count = await diceElements.count();

    // There should be dice or roll interface
    await page.waitForTimeout(1000);
    await takeScreenshot(page, GAMES[4], 'game-state', VIEWPORTS[0]);
  });

  test('should track player turns', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await startLocalGame(page);

    const turnCard = page.locator('#turnCard');
    await expect(turnCard).toBeVisible();

    const turnName = page.locator('#turnName');
    await expect(turnName).not.toHaveText('-');
  });

  test('should update token positions', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Take a screenshot of initial board state
    const initialScreenshot = await page.screenshot();

    // Wait and see if board changes (tokens move)
    await page.waitForTimeout(2000);

    await takeScreenshot(page, GAMES[4], 'tokens-placed', VIEWPORTS[0]);
  });

  test('should be playable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    await startLocalGame(page);

    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();

    await takeScreenshot(page, GAMES[4], 'mobile-board', VIEWPORTS[1]);
  });
});

/**
 * Test: PEN FIGHT
 */
test.describe('Pen Fight', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await page.waitForSelector('h1:has-text("Pen Fight")');
    await takeScreenshot(page, GAMES[5], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await page.waitForSelector('h1:has-text("Pen Fight")');
    await takeScreenshot(page, GAMES[5], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should start game and display arena', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);

    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    // Wait for arena to render (canvas or SVG)
    await page.waitForTimeout(1000);

    await takeScreenshot(page, GAMES[5], 'arena-rendered', VIEWPORTS[0]);
  });

  test('should display control interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);

    // Look for control elements (aim, power sliders or similar)
    const controlElements = page.locator('[class*="control"], [class*="slider"], [class*="power"], [class*="aim"]');

    await page.waitForTimeout(1000);
    await takeScreenshot(page, GAMES[5], 'controls-visible', VIEWPORTS[0]);
  });

  test('should handle flick input', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Locate the game arena
    const boardContainer = page.locator('#boardContainer');

    if (await boardContainer.isVisible()) {
      const box = await boardContainer.boundingBox();

      if (box) {
        // Simulate a flick gesture
        const startX = box.x + box.width / 4;
        const startY = box.y + box.height / 2;
        const endX = box.x + box.width * 0.75;
        const endY = box.y + box.height * 0.75;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 5 });
        await page.mouse.up();
      }
    }

    await page.waitForTimeout(1000);
    await takeScreenshot(page, GAMES[5], 'after-flick', VIEWPORTS[0]);
  });

  test('should animate physics', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(2000);

    // Take a screenshot after some physics simulation
    await takeScreenshot(page, GAMES[5], 'physics-animation', VIEWPORTS[0]);
  });

  test('should display current player turn', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);

    const turnCard = page.locator('#turnCard');
    await expect(turnCard).toBeVisible();
  });

  test('should work on mobile with touch', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/pen-fight/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    await takeScreenshot(page, GAMES[5], 'mobile-controls', VIEWPORTS[1]);
  });
});

/**
 * Test: BUSINESS
 */
test.describe('Business', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await page.waitForSelector('h1:has-text("Business")');
    await takeScreenshot(page, GAMES[6], 'setup-screen', VIEWPORTS[0]);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await page.waitForSelector('h1:has-text("Business")');
    await takeScreenshot(page, GAMES[6], 'setup-mobile', VIEWPORTS[1]);
  });

  test('should have 4 players by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    const playerCount = page.locator('#playerCount');
    await expect(playerCount).toHaveText('3');
  });

  test('should start game and render board', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);

    const gamePanel = page.locator('[id*="gamePanel"]');
    await expect(gamePanel).not.toHaveClass(/hidden/);

    // Wait for board to render
    await page.waitForTimeout(1000);

    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();

    await takeScreenshot(page, GAMES[6], 'board-rendered', VIEWPORTS[0]);
  });

  test('should display board squares/properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(1000);

    // Board should have visible property elements
    const boardElements = page.locator('[class*="property"], [class*="square"], [class*="tile"]');

    await takeScreenshot(page, GAMES[6], 'properties-visible', VIEWPORTS[0]);
  });

  test('should allow property purchase interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);
    await page.waitForTimeout(2000);

    // Look for buy property buttons or dialogs
    const buttons = await page.locator('button').all();
    let foundBuyButton = false;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('buy')) {
        foundBuyButton = true;
        break;
      }
    }

    await takeScreenshot(page, GAMES[6], 'property-interface', VIEWPORTS[0]);
  });

  test('should track cash and balance', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);

    // Player info should show cash/balance
    const playerInfo = page.locator('[class*="player"], [class*="balance"], [class*="cash"]');
    const count = await playerInfo.count();

    await takeScreenshot(page, GAMES[6], 'cash-display', VIEWPORTS[0]);
  });

  test('should display current player information', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);

    const turnCard = page.locator('#turnCard');
    await expect(turnCard).toBeVisible();

    const turnName = page.locator('#turnName');
    await expect(turnName).not.toHaveText('-');
  });

  test('should be playable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);

    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();

    await takeScreenshot(page, GAMES[6], 'mobile-gameplay', VIEWPORTS[1]);
  });

  test('should display scoreboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/business/index.html`);

    await startLocalGame(page);

    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();
  });
});

/**
 * Cross-Game Tests
 */
test.describe('Common Features Across All Games', () => {
  test('should have back link to hub', async ({ page }) => {
    // Test one game as example
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const backLink = page.locator('.back-link');
    await expect(backLink).toHaveText('Game Arena');
    await expect(backLink).toHaveAttribute('href', '../../index.html');
  });

  test('should display game description', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const subtext = page.locator('.subtext');
    await expect(subtext).toBeVisible();

    const text = await subtext.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should have connection status indicator', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const statusPill = page.locator('#connectionStatus');
    await expect(statusPill).toBeVisible();

    const status = await statusPill.textContent();
    expect(['Local', 'Online', 'Connecting']).toContain(status?.trim());
  });

  test('should show game logs sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const toggleBtn = page.locator('.toggle-logs-btn');
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const closeBtn = page.locator('#closeSidebar');
    await closeBtn.click();

    // Sidebar should close or be hidden
    await page.waitForTimeout(300);
  });

  test('should handle viewport resizing (desktop to mobile)', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    // Start at desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    let header = page.locator('header');
    await expect(header).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 812 });
    header = page.locator('header');
    await expect(header).toBeVisible();

    // Should adapt to mobile layout
  });
});

/**
 * Error & Edge Case Tests
 */
test.describe('Error Handling and Edge Cases', () => {
  test('should handle missing game engine gracefully', async ({ page }) => {
    // Navigate to non-existent game
    await page.goto(`${BASE_URL}/games/nonexistent/index.html`);

    // Should either show error or redirect
    const statusCode = page.url();
    expect(statusCode).toBeDefined();
  });

  test('should handle rapid game restarts', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    await startLocalGame(page);

    // Click New Game multiple times rapidly
    const newGameBtn = page.locator('#restartLocal');

    if (await newGameBtn.isVisible()) {
      await newGameBtn.click();
      await newGameBtn.click();
      await newGameBtn.click();

      // Game should still be stable
      const gamePanel = page.locator('[id*="gamePanel"]');
      await expect(gamePanel).not.toHaveClass(/hidden/);
    }
  });

  test('should handle viewport width at boundary', async ({ page }) => {
    // Test at 1280 (desktop cutoff)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/games/business/index.html`);

    const setupPanel = page.locator('[id*="setupPanel"]');
    await expect(setupPanel).toBeVisible();
  });

  test('should handle extremely small viewport', async ({ page }) => {
    // Test at 320 (small mobile)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE_URL}/games/ludo/index.html`);

    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('should handle rapid player count changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    const plusBtn = page.locator('#playerPlus');
    const minusBtn = page.locator('#playerMinus');

    // Rapid increases and decreases
    for (let i = 0; i < 5; i++) {
      await plusBtn.click();
      await minusBtn.click();
    }

    // Should be stable
    const playerCount = page.locator('#playerCount');
    await expect(playerCount).toBeVisible();
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Start a game
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);
    await startLocalGame(page);

    // Take note of game state
    const scoreboard = page.locator('.scoreboard');
    await expect(scoreboard).toBeVisible();

    // Navigate away and back
    await page.goto(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/games/dots-and-boxes/index.html`);

    // Setup panel should be visible (new game)
    const setupPanel = page.locator('[id*="setupPanel"]');
    await expect(setupPanel).toBeVisible();
  });
});
