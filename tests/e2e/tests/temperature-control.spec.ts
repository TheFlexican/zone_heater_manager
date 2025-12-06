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
});

