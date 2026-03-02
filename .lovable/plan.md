

## Plan: Add Sound Effects to HabitBuddy

### Approach

Create a lightweight sound utility module that generates short sound effects using the Web Audio API (no external dependencies or API keys needed). This keeps things instant, offline-compatible (PWA), and free.

### What Gets Built

**1. Sound utility module (`src/lib/sounds.ts`)**
- A collection of functions that synthesize short sounds using the Web Audio API (oscillators + gain envelopes)
- Sound types:
  - `playClickSound()` — short subtle click/pop for button interactions
  - `playHabitCompleteSound()` — cheerful ascending tone sequence for habit completion
  - `playRedeemSound()` — coin/cash-register style sound for reward redemption
  - `playApprovalSound()` — triumphant fanfare for approved rewards
  - `playStepCompleteSound()` — soft tick for completing a habit step

**2. Child Mode (`src/pages/ChildMode.tsx`)**
- `handleCompleteHabitWithoutSteps` — play `playHabitCompleteSound()` on successful completion
- `handleStepComplete` — play `playStepCompleteSound()` per step; play `playHabitCompleteSound()` when all steps done
- `handleRedeemReward` — play `playRedeemSound()` on successful redemption
- Real-time approval subscription — play `playApprovalSound()` when a reward is approved
- Tab switching / main button clicks — play `playClickSound()`

**3. Parent Dashboard & Child Detail (`src/pages/ParentDashboard.tsx`, `src/pages/ChildDetail.tsx`)**
- Add `playClickSound()` on key button interactions (add child, approve/deny reward, navigation)

### Technical Details

- **Web Audio API** — no network requests, works offline, ~50 lines of code
- Each sound function creates a short-lived `OscillatorNode` with a `GainNode` envelope, auto-disconnects after playing
- Sounds are non-blocking (fire-and-forget)
- A `AudioContext` singleton is lazily initialized on first user interaction (browser autoplay policy compliance)

