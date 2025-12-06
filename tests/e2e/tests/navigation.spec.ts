import { test, expect } from '@playwright/test';
import { navigateToSmartHeating, navigateToArea } from './helpers';

test.describe('Navigation Tests', () => {
  test('should load Smart Heating panel', async ({ page }) => {
    await navigateToSmartHeating(page);
    
    // Wait for the main content to load
    await expect(page.locator('text=Zones')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Target Temperature').first()).toBeVisible();
  });

  test('should display areas list', async ({ page }) => {
    await navigateToSmartHeating(page);
    
    // Should show at least one area
    await expect(page.locator('[role="button"]').first()).toBeVisible();
  });

  test('should navigate to area detail', async ({ page }) => {
    await navigateToArea(page, 'Living Room');
    
    // Check for tabs which indicates we're in area detail
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule")')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
  });

  test('should have all tabs in area detail', async ({ page }) => {
    await navigateToArea(page, 'Living Room');
    
    // Check all tabs are present
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Devices")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule")')).toBeVisible();
    await expect(page.locator('button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Learning")')).toBeVisible();
    await expect(page.locator('button:has-text("Logs")')).toBeVisible();
  });
});
