# Copilot Instructions - Smart Heating

## Project Overview
Home Assistant integration for zone-based heating control with learning capabilities.

**Tech Stack:** Python 3.13, React + TypeScript + Material-UI v5, Docker test environment

## Critical Rules

**RULE #1: Never Remove Features Without Permission**
- ALWAYS ask before removing/changing functionality
- When in doubt, KEEP existing feature and ADD new one

**RULE #2: E2E Testing Required**
- Run `cd tests/e2e && npm test` after ALL code changes
- All tests must pass (100%) before committing

**RULE #3: Git Operations Require User Approval**
- **NEVER** commit code without user testing and approval first
- **NEVER** create git tags without explicit user request
- **NEVER** push to GitHub without user confirmation
- After implementing features: Deploy → Let user test → Wait for approval → THEN commit/tag/push
- Workflow: Code → Deploy → Test → Approve → Git operations

**RULE #4: Update Documentation Before Releases**
- **ALWAYS** update CHANGELOG.md and README.md BEFORE creating releases
- CHANGELOG.md must include new version section with all changes
- README.md must document new features in appropriate sections
- Update API documentation if endpoints changed
- Workflow: Code → Test → Update Docs → Commit → Tag Release

## Key Directories
```
smart_heating/          # Main integration (backend .py files + frontend/)
tests/e2e/             # Playwright tests
sync.sh / setup.sh     # Deploy to test container
```

## Development Workflow

**Primary Script:** `./sync.sh` - builds frontend, syncs to container, restarts HA
**Full Reset:** `./setup.sh` - complete container restart (use when sync.sh isn't enough)

```bash
# Normal cycle:
1. Edit code
2. ./sync.sh
3. Clear cache (Cmd+Shift+R)
4. Test at http://localhost:8123
```

## Testing

**Run tests:** `cd tests/e2e && npm test`
**Test files:** navigation, temperature-control, boost-mode, comprehensive-features, sensor-management, backend-logging

**Debug tests:**
- Run headed: `npm test -- --headed`
- Add `await page.pause()` for inspection
- Check `playwright.config.ts` for headless setting

## API Architecture

### Backend (api.py)
Key endpoints: `/api/smart_heating/areas`, `/devices`, `/schedule/*`, `/learning/*`

**Critical patterns:**
- Always exclude `"learning_engine"` from coordinator data before returning
- Device discovery is platform-agnostic (works with ALL HA integrations, not just MQTT)

### Frontend (api.ts)
TypeScript client wrapping backend REST API

### WebSocket (websocket.py)
Real-time updates via `smart_heating/subscribe` event type

## TypeScript & React

**Key files:**
- `types.ts` - Zone, Device, ScheduleEntry, LearningData interfaces
- `api.ts` - Frontend API client
- Material-UI v5 components
- WebSocket updates via custom hooks

**Build:** `cd smart_heating/frontend && npm run build` (or use sync.sh)
**TypeScript strict mode:** Remove unused imports, no implicit any

## Common Tasks

### Adding Features
1. **Backend:** Update coordinator, add API endpoint, update services.yaml
2. **Frontend:** Add types, API functions, UI components, WebSocket subscriptions
3. **Deploy:** `./sync.sh` → Clear cache (Cmd+Shift+R) → **WAIT FOR USER TO TEST**
4. **After user approval:** Run E2E tests if needed
5. **After user confirms:** Ask before committing/tagging/pushing to git

### Debugging
- Browser: Check Network/Console tabs
- Backend: `docker logs -f homeassistant-test`
- Common fixes:
  - 500 errors → Check learning_engine exclusions
  - Stale UI → Check WebSocket subscription
  - Build fails → Remove unused imports
  - Changes not visible → Clear cache

## Important Patterns

### Device Heating Status
Use `area.target_temperature > device.current_temperature`, NOT `device.hvac_action`

### Coordinator Data Returns
Always exclude learning_engine:
```python
return {k: v for k, v in coordinator.data.items() if k != "learning_engine"}
```

### Material-UI Imports
Only import used components:
```typescript
import { Box, Typography, Button } from '@mui/material'
```

---

**Version:** v0.3.17 | **Test URL:** http://localhost:8123
