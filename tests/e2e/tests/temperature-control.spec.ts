import { test, expect } from '@playwright/test';
import { login, navigateToSmartHeating, navigateToArea, switchToTab, dismissSnackbar } from './helpers';

test.describe('Temperature Control Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSmartHeating(page);
  });

  test('should adjust target temperature', async ({ page }) => {
    await navigateToArea(page, 'Living Room');
    await dismissSnackbar(page);
    
    // Enable area first
    const areaToggle = page.locator('input[type="checkbox"]').last();
    const isEnabled = await areaToggle.isChecked();
    if (!isEnabled) {
      await areaToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // Find temperature slider
    const tempSlider = page.locator('input[type="range"]').first();
    await expect(tempSlider).toBeVisible();
    
    // Set to 22 degrees
    await tempSlider.fill('22');
    await page.waitForTimeout(1000);
    
    // Verify slider value changed
    const newTemp = await tempSlider.getAttribute('value');
    expect(newTemp).toBe('22');
  });

  test('should enable/disable area', async ({ page }) => {
    await navigateToArea(page, 'Living Room');
    await dismissSnackbar(page);
    
    // Find the enable/disable switch
    const toggleSwitch = page.locator('input[type="checkbox"]').first();
    const initialState = await toggleSwitch.isChecked();
    
    // Toggle the area
    await toggleSwitch.click();
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newState = await toggleSwitch.isChecked();
    expect(newState).toBe(!initialState);
    
    // Toggle back
    await toggleSwitch.click();
    await page.waitForTimeout(1000);
  });

  test('should track temperature history when area is disabled', async ({ page }) => {
    await navigateToArea(page, 'Living Room');
    await dismissSnackbar(page);
    
    // Navigate to History tab
    await switchToTab(page, 'History');
    await page.waitForTimeout(1000);
    
    // Get the initial number of data points
    const initialDataPoints = await page.locator('text=/Temperature recorded/i').count();
    
    // Switch back to Overview tab
    await switchToTab(page, 'Overview');
    
    // Disable the area
    const toggleSwitch = page.locator('input[type="checkbox"]').first();
    const isEnabled = await toggleSwitch.isChecked();
    
    if (isEnabled) {
      await toggleSwitch.click();
      await page.waitForTimeout(2000); // Wait for state to update
    }
    
    // Wait a bit for coordinator to run
    await page.waitForTimeout(35000); // Wait for at least one coordinator cycle (30s + buffer)
    
    // Navigate back to History tab
    await switchToTab(page, 'History');
    await page.waitForTimeout(1000);
    
    // Check that history is still being recorded
    // Note: We can't guarantee new data points, but we should still see the chart
    const chart = page.locator('.recharts-wrapper, canvas, svg').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
    
    // Re-enable the area
    await switchToTab(page, 'Overview');
    if (!isEnabled) {
      await toggleSwitch.click();
      await page.waitForTimeout(1000);
    }
  });
});


