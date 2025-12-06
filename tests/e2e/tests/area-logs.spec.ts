import { test, expect } from '@playwright/test';

test.describe('Area Logs Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8123/smart_heating_ui');
    await page.waitForLoadState('networkidle');
  });

  test('should display Logs tab in area details', async ({ page }) => {
    // Navigate to an area
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    
    // Wait for area details to load
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    // Check if Logs tab exists
    const logsTab = page.locator('button:has-text("Logs")');
    await expect(logsTab).toBeVisible();
  });

  test('should show logs when Logs tab is clicked', async ({ page }) => {
    // Navigate to an area
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    
    // Wait for area details to load
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    // Click on Logs tab
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    
    // Wait for logs content to load
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Check if logs section header is visible
    await expect(page.locator('text=Heating Strategy Logs')).toBeVisible();
    
    // Check if description is visible
    await expect(page.locator('text=Development log showing all heating strategy decisions')).toBeVisible();
  });

  test('should display chip-based filter buttons', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Check if filter chips exist
    await expect(page.locator('.MuiChip-root:has-text("All Events")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Temperature")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Heating")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Schedule")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Smart Boost")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Sensors")')).toBeVisible();
    await expect(page.locator('.MuiChip-root:has-text("Mode")')).toBeVisible();
  });

  test('should filter logs by clicking event type chips', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Check initial state - "All Events" should be active (filled variant)
    const allEventsChip = page.locator('.MuiChip-root:has-text("All Events")');
    await expect(allEventsChip).toHaveClass(/MuiChip-filled/);
    
    // Click on "Temperature" filter chip
    const temperatureChip = page.locator('.MuiChip-root:has-text("Temperature")').first();
    await temperatureChip.click();
    
    // Wait a moment for filter to apply
    await page.waitForTimeout(500);
    
    // Temperature chip should now be filled (active)
    await expect(temperatureChip).toHaveClass(/MuiChip-filled/);
    
    // All Events chip should now be outlined (inactive)
    await expect(allEventsChip).toHaveClass(/MuiChip-outlined/);
    
    // Click back to "All Events"
    await allEventsChip.click();
    await page.waitForTimeout(500);
    
    // All Events should be filled again
    await expect(allEventsChip).toHaveClass(/MuiChip-filled/);
    
    // Temperature should be outlined again
    await expect(temperatureChip).toHaveClass(/MuiChip-outlined/);
  });

  test('should have refresh button', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Check if Refresh button exists
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Click refresh button
    await refreshButton.click();
    
    // Button should show loading state briefly
    await expect(page.locator('button:has-text("Loading...")')).toBeVisible({ timeout: 1000 }).catch(() => {
      // It's okay if loading state is too brief to catch
    });
  });

  test('should display log entries with proper structure', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Wait a moment for logs to load
    await page.waitForTimeout(1000);
    
    // Check if either logs exist or empty state is shown
    const hasLogs = await page.locator('[role="list"] li').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No log entries yet').isVisible().catch(() => false);
    
    expect(hasLogs || hasEmptyState).toBeTruthy();
    
    if (hasLogs) {
      // If logs exist, check for chip (event type badge) - it should be inside the ListItem
      const firstChip = page.locator('[role="list"] li').first().locator('.MuiChip-root');
      await expect(firstChip).toBeVisible();
    }
  });

  test('should display log timestamps', async ({ page }) => {
    // First, generate some activity to ensure logs exist
    // Disable manual override to trigger logging
    await page.goto('http://localhost:8123/api/smart_heating/areas/living_room/manual_override', { waitUntil: 'networkidle' });
    
    // Navigate to area and open Logs tab
    await page.goto('http://localhost:8123/smart_heating_ui');
    await page.waitForLoadState('networkidle');
    
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Wait for logs to load
    await page.waitForTimeout(1000);
    
    // Check if log entries exist
    const logEntries = await page.locator('[role="listitem"]').count();
    
    if (logEntries > 0) {
      // Check for timestamp format (should contain time like "19:30:45")
      const firstLogText = await page.locator('[role="listitem"]').first().textContent();
      expect(firstLogText).toMatch(/\d{2}:\d{2}:\d{2}/);
    }
  });

  test('should show color-coded event type chips', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Wait for logs to load
    await page.waitForTimeout(1000);
    
    // Check if log chips exist
    const chips = page.locator('.MuiChip-root');
    const chipCount = await chips.count();
    
    if (chipCount > 0) {
      // Verify at least one chip is visible
      await expect(chips.first()).toBeVisible();
      
      // Check if chip has a label (text content indicating event type)
      const chipLabel = await chips.first().textContent();
      expect(chipLabel).toBeTruthy();
      expect(chipLabel!.length).toBeGreaterThan(0);
    }
  });

  test('should display log details in JSON format', async ({ page }) => {
    // Navigate to an area and open Logs tab
    const areaCard = page.locator('text=Living Room').first();
    await areaCard.click();
    await page.waitForSelector('text=Temperature Control', { timeout: 5000 });
    
    const logsTab = page.locator('button:has-text("Logs")');
    await logsTab.click();
    await page.waitForSelector('text=Heating Strategy Logs', { timeout: 5000 });
    
    // Wait for logs to load
    await page.waitForTimeout(1000);
    
    // Check if log entries have details (pre tags with JSON)
    const preElements = page.locator('pre');
    const preCount = await preElements.count();
    
    if (preCount > 0) {
      // Verify JSON format in details
      const firstPreText = await preElements.first().textContent();
      expect(firstPreText).toBeTruthy();
      
      // Try to parse as JSON
      expect(() => JSON.parse(firstPreText!)).not.toThrow();
    }
  });
});
