# Exam Room Debugging Guide

## ✅ All Critical Fixes Implemented

### Fixed Issues:

1. ✅ **Input data loss** - isDirty + isFocused protection in LocalInput & EssayRenderer
2. ✅ **Re-render hell** - Timer uses refs + direct DOM updates (no React re-renders)
3. ✅ **Race conditions** - Polling at 30s, dirty flag persists 2s after blur
4. ✅ **Saving status** - Now properly shows all states (idle/saving/saved/error)
5. ✅ **Timer display** - Uses hybrid approach (server sync + local countdown)

---

## 🧪 How to Verify Fixes

### 1. Check Input Protection

Open browser console and add this temporarily to `LocalInput.jsx`:

```javascript
// At the top of useEffect
console.log('🛡️ Sync attempt:', {
  isFocused: isFocusedRef.current,
  isDirty: isDirtyRef.current,
  blocked: isFocusedRef.current || isDirtyRef.current,
  value,
  localValue,
});
```

**Expected:** While typing, you should see `blocked: true`

---

### 2. Check Re-render Frequency

Install React DevTools Profiler:

1. Open DevTools → Components → Profiler
2. Start recording
3. Type in an input field
4. Stop after 10 seconds
5. Check flamegraph

**Expected:**

- ExamRoomLayout: 0 renders during typing
- LocalInput: Only renders when YOU type (not from parent)
- Timer updates: Not visible in profiler (direct DOM)

---

### 3. Check Network Tab

Open Network tab while in exam:

1. Filter by XHR
2. Watch for requests

**Expected:**

- `exam-status`: Every ~30 seconds (not 5s)
- `save-draft`: Only after 300ms of no typing
- No flooding of requests

---

### 4. Check Saving Indicator

1. Type in any input
2. Stop typing
3. Watch header status

**Expected Timeline:**

- 0ms: You type
- 300ms: Shows "Saving..." (debounce ends)
- 500ms: Changes to "Progress Saved" (API returns)

**If stuck on "Saving...":**

- Check console for errors
- Check Network tab for failed requests
- Verify API endpoint is responding

---

## 🐛 Known Edge Cases

### Slow Network

If user has slow connection:

- Dirty flag protection: 2 seconds
- If API takes >2s, might see brief flicker
- **Solution:** Increase timeout in LocalInput line 33 to 5000ms

### Browser Back Button

If user hits browser back:

- useEffect cleanup might not fire
- **Workaround:** Added beforeunload handler (check useExamEngine)

### Multiple Tabs

If user opens exam in 2 tabs:

- Each tab has own polling
- Server might receive conflicting saves
- **Current behavior:** Last save wins (acceptable)

---

## 🔍 Troubleshooting

### Problem: Letters still disappearing

**Check 1:** Is dev server running with latest code?

```bash
cd 404online.uz
rm -rf .next
npm run dev
```

**Check 2:** Hard refresh browser

```
Ctrl + Shift + R (Chrome/Firefox)
Cmd + Shift + R (Mac)
```

**Check 3:** Verify LocalInput changes applied
Look for `isDirtyRef` in the component - if not there, file didn't save.

---

### Problem: "Saving..." stuck

**Check 1:** Console errors
Look for red errors in console. Common:

- Network error
- 401 Unauthorized
- 500 Server error

**Check 2:** Auto-save logic in useExamEngine
Add console.log at line ~180 (handleAutoSave function)

**Check 3:** API response
Check Network tab → save-draft request → Response
Should return 200 OK with updated submission object

---

### Problem: Timer not updating

**Check 1:** Is exam in strict mode?
Timer only runs if `useStatusHook` is true (exam mode, not practice)

**Check 2:** DOM ref attached?
Open Elements tab → Find timer span → Should have `ref` attribute

**Check 3:** Console log in timer useEffect
Add `console.log('⏱️ Timer tick:', displayTimeRef.current)` at line 130

---

## 📊 Performance Benchmarks

**Expected metrics** (with React DevTools Profiler):

| Action          | Re-renders | Time   |
| --------------- | ---------- | ------ |
| Page load       | ~3         | <500ms |
| Type 1 letter   | 0          | <16ms  |
| Timer countdown | 0          | <1ms   |
| Polling (30s)   | 0\*        | <100ms |
| Section switch  | 1-2        | <200ms |

\*Polling might trigger 1 re-render if server data actually changed

---

## 🚨 Emergency Rollback

If all else fails, revert to previous working state:

```bash
git log --oneline -10  # Find last good commit
git checkout <commit-hash> -- components/exam/
git checkout <commit-hash> -- hooks/useExamEngine.js
git checkout <commit-hash> -- hooks/useExamStatus.js
```

---

## 📞 Support

If issues persist after following this guide:

1. Export React Profiler recording (JSON)
2. Export Network HAR file
3. Share console logs
4. Provide exact reproduction steps
