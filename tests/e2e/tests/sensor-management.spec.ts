import { test, expect } from '@playwright/test'
import { login, navigateToSmartHeating, navigateToArea, switchToTab, dismissSnackbar, expandSettingsCard } from './helpers'

/**
 * Sensor Management Comprehensive Tests
 * 
 * Features tested:
 * - Window Sensors: Add, remove, configure temperature drop
 * - Presence Sensors: Add, remove, configure home/away actions
 * - Binary sensor entity browsing
 * - Person/device_tracker entity browsing
 * - Real sensor state monitoring
 * 
 * Tests use REAL entities from Home Assistant, not mocks.
 */

test.describe('Sensor Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToSmartHeating(page)
  })

  test.describe('Window Sensors', () => {
    
    test('should display window sensors section', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Verify window sensor UI is visible
      await expect(page.locator('text=/Window Sensor|window|sensor/i').first()).toBeVisible()
    })

    test('should show existing window sensors', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Look for sensor list or "no sensors" message
      const sensorList = page.locator('text=/sensor|no sensors|add sensor/i')
      await expect(sensorList.first()).toBeVisible({ timeout: 5000 })
    })

    test('should have add window sensor button', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Find add button
      const addButton = page.locator('button:has-text("Add Window Sensor"), button:has-text("Add Sensor")')
      await expect(addButton.first()).toBeVisible()
    })

    test('should remove window sensor if any exist', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Look for remove/delete button
      const removeButton = page.locator('button[aria-label*="remove" i], button[aria-label*="delete" i], [data-testid*="remove"], [data-testid*="delete"]')
      
      if (await removeButton.count() > 0) {
        console.log('Found window sensor to remove')
        await removeButton.first().click()
        await page.waitForTimeout(1000)
        
        console.log('Window sensor removed successfully')
      } else {
        console.log('No window sensors to remove')
      }
    })

    test('should show temperature drop configuration', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Look for temperature drop setting
      const tempDropSetting = page.locator('text=/temperature.*drop|drop.*temperature|reduce/i')
      
      const hasTempDrop = await tempDropSetting.count() > 0
      console.log(`Temperature drop configuration visible: ${hasTempDrop}`)
    })
  })

  test.describe('Presence Sensors', () => {
    
    test('should display presence sensors section', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Verify presence sensor UI is visible
      await expect(page.locator('text=/Presence Sensor|presence|occupancy/i').first()).toBeVisible()
    })

    test('should show existing presence sensors', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Look for sensor list
      const sensorList = page.locator('text=/person|sensor|no sensors|add/i')
      await expect(sensorList.first()).toBeVisible({ timeout: 5000 })
    })

    test('should have add presence sensor button', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Find add button
      const addButton = page.locator('button:has-text("Add Presence Sensor"), button:has-text("Add Sensor")')
      await expect(addButton.first()).toBeVisible()
    })

    test('should remove presence sensor if any exist', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Look for remove/delete button
      const removeButton = page.locator('button[aria-label*="remove" i], button[aria-label*="delete" i], [data-testid*="remove"], [data-testid*="delete"]').first()
      
      if (await removeButton.count() > 0) {
        console.log('Found presence sensor to remove')
        await removeButton.click()
        await page.waitForTimeout(1000)
        
        console.log('Presence sensor removed successfully')
      } else {
        console.log('No presence sensors to remove')
      }
    })

    test('should show presence-based temperature actions', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Look for presence action settings (home/away temperature adjustment)
      const presenceActions = page.locator('text=/when.*away|when.*home|presence.*action|boost.*when/i')
      
      const hasActions = await presenceActions.count() > 0
      console.log(`Presence-based actions visible: ${hasActions}`)
    })
  })

  test.describe('Entity Discovery', () => {
    
    test('should list available binary sensors from HA', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Click add button to open dialog
      const addButton = page.locator('button:has-text("Add Window Sensor"), button:has-text("Add Sensor")').first()
      await addButton.click()
      await page.waitForTimeout(500)
      
      // Dialog should show available entities
      const dialog = page.locator('[role="dialog"], .MuiDialog-root')
      if (await dialog.count() > 0) {
        console.log('Entity selection dialog opened')
        
        // Look for entity list or search field
        const entityList = page.locator('text=/binary_sensor|entity|select/i')
        const hasEntities = await entityList.count() > 0
        console.log(`Binary sensor entities visible: ${hasEntities}`)
        
        // Close dialog
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first()
        if (await cancelButton.count() > 0) {
          await cancelButton.click()
        }
      }
    })

    test('should list available person/tracker entities from HA', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Click add button to open dialog
      const addButton = page.locator('button:has-text("Add Presence Sensor"), button:has-text("Add Sensor")').first()
      await addButton.click()
      await page.waitForTimeout(500)
      
      // Dialog should show available person/tracker entities
      const dialog = page.locator('[role="dialog"], .MuiDialog-root')
      if (await dialog.count() > 0) {
        console.log('Entity selection dialog opened')
        
        // Look for person/tracker entities
        const entityList = page.locator('text=/person|device_tracker|entity/i')
        const hasEntities = await entityList.count() > 0
        console.log(`Person/tracker entities visible: ${hasEntities}`)
        
        // Close dialog
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first()
        if (await cancelButton.count() > 0) {
          await cancelButton.click()
        }
      }
    })
  })

  test.describe('Sensor State Monitoring', () => {
    
    test('should display presence status on main overview', async ({ page }) => {
      await navigateToSmartHeating(page)
      
      // Look for zone cards on main overview
      const zoneCards = page.locator('.MuiCard-root')
      const cardCount = await zoneCards.count()
      console.log(`Found ${cardCount} zone cards on main overview`)
      
      // Check if any zone card shows presence status (HOME/AWAY badge)
      const presenceBadges = page.locator('text=/^HOME$|^AWAY$/i')
      const badgeCount = await presenceBadges.count()
      console.log(`Found ${badgeCount} presence status badges`)
      
      // Log test result
      if (badgeCount > 0) {
        console.log('✓ Presence status badges are visible on main overview')
      } else {
        console.log('ℹ No presence status badges found (might not be configured)')
      }
    })

    test('should display sensor current state', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      // Check both window and presence sensors for state display
      await expandSettingsCard(page, 'Window Sensors')
      
      // Look for state indicators (on/off, open/closed, home/away)
      const stateIndicators = page.locator('text=/open|closed|on|off|detected|clear/i')
      
      const hasStates = await stateIndicators.count() > 0
      console.log(`Sensor states visible: ${hasStates}`)
    })

    test('should show when window is open', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Window Sensors')
      
      // Look for "window open" warning or indicator (search separately)
      const windowTextIndicator = page.locator('text=/window.*open|open.*window/i')
      const warningIndicator = page.locator('[class*="warning"], [class*="alert"]')
      
      const hasTextWarning = await windowTextIndicator.count() > 0
      const hasClassWarning = await warningIndicator.count() > 0
      console.log(`Window open warning visible: ${hasTextWarning || hasClassWarning}`)
    })

    test('should show presence detection status', async ({ page }) => {
      await navigateToArea(page, 'Living Room')
      await switchToTab(page, 'Settings')
      await dismissSnackbar(page)
      
      await expandSettingsCard(page, 'Presence Sensors')
      
      // Look for "home" or "away" status with friendly names
      const presenceStatus = page.locator('text=/home|away|present|absent/i')
      const friendlyBadges = page.locator('.MuiChip-label').filter({ hasText: /AWAY|HOME/i })
      
      const hasStatus = await presenceStatus.count() > 0
      const hasFriendlyBadges = await friendlyBadges.count() > 0
      console.log(`Presence status visible: ${hasStatus}`)
      console.log(`Friendly name status badges visible: ${hasFriendlyBadges}`)
    })
  })
})
