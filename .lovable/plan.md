

## Plan: Optimistic UI Updates for Habit Completion (No Page Reload)

### Problem
Every time a child completes a habit or step, `fetchChildData()` is called, which sets `isLoading(true)` and re-fetches **all** data (child, habits, rewards, redemptions, badges), causing a visible loading flash.

### Solution
Replace the `fetchChildData()` calls after habit/step completion with **optimistic local state updates** — update the React state directly with the expected new values instead of refetching everything from the database.

### Changes (single file: `src/pages/ChildMode.tsx`)

1. **`handleCompleteHabitWithoutSteps`** (around line 508-509):
   - Remove `await fetchChildData()`
   - After successful insert + coin update, optimistically update:
     - `child.coin_balance` += coins earned
     - The habit's `completionsToday` += 1, `canComplete` recalculated, `lastCompletedAt` set to now, `nextAvailableAt` calculated if cooldown applies
   - If badges were awarded, append them to `badges` state

2. **`handleStepComplete`** (around line 584-585):
   - Remove `await fetchChildData()`
   - After successful step insert, optimistically update:
     - The step's `completed` flag to `true`, `completedSteps` += 1
     - If all steps now completed: update `child.coin_balance`, habit's `completionsToday`, `canComplete`, etc.
   - If badges were awarded, append them to `badges` state

3. **`handleRedeemReward`** (if it also calls `fetchChildData`):
   - Apply the same pattern: update `child.coin_balance` and `redemptions` state locally

4. **Error handling**: Keep the `fetchChildData()` call in `catch` blocks to restore accurate state on failure.

5. **`fetchChildData`**: Remove `setIsLoading(true)` for subsequent calls (only show loading on initial mount), or better yet, the optimistic updates eliminate the need to call it after actions entirely.

