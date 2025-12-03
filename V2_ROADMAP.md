# TypeX V2 Roadmap

## Overview
V2 focuses on enhancing user engagement, social features, and advanced functionality to make TypeX a more complete typing platform.

## V2 Features (Priority Order)

### 1. OAuth Authentication (GitHub/Google) ✅ COMPLETED
**Why:** Reduces friction for new users, no password management
**Impact:** Higher signup conversion, better UX
**Difficulty:** Medium
**Time:** 4-6 hours

**Implementation:**
- ✅ Backend: Add Passport.js with GitHub/Google strategies
- ✅ Frontend: Add OAuth buttons to login/register pages
- ✅ Store OAuth provider info in User model
- ✅ Handle account linking (email + OAuth)

### 2. Friend System & Private Rooms ✅ COMPLETED
**Why:** Enables social gaming, private matches with friends
**Impact:** Increased user retention, social engagement
**Difficulty:** Medium-Hard
**Time:** 6-8 hours

**Implementation:**
- ✅ Backend: Friend model (User A → User B, status: pending/accepted/blocked)
- ✅ API: Send/accept/decline friend requests
- ✅ Frontend: Friends list, friend search, friend status
- ✅ Private rooms: Only friends can join, password-protected rooms
- ✅ Socket.io: Friend online status, notifications

### 3. User Profiles & Statistics ✅ COMPLETED
**Why:** Users want to see their progress and achievements
**Impact:** Increased engagement, competitive motivation
**Difficulty:** Medium
**Time:** 4-5 hours

**Implementation:**
- ✅ Backend: User stats (total races, best WPM, accuracy, win rate)
- ✅ Frontend: Profile page with stats, achievements, recent races
- ✅ Charts: WPM over time, accuracy trends
- ✅ Badges/Achievements system

### 4. Advanced Anti-Cheat ⭐ MEDIUM PRIORITY
**Why:** Ensure fair competition
**Impact:** Better user trust, competitive integrity
**Difficulty:** Hard
**Time:** 6-8 hours

**Implementation:**
- Server-side WPM validation (compare client vs server calculations)
- Typing pattern analysis (keystroke timing, consistency)
- Suspicious behavior detection (impossible WPM, perfect accuracy)
- Auto-flagging and manual review system

### 5. Richer Analytics & Insights ⭐ LOW PRIORITY
**Why:** Help users improve their typing
**Impact:** Educational value, user retention
**Difficulty:** Medium
**Time:** 4-6 hours

**Implementation:**
- Detailed race analytics (per-word accuracy, speed by section)
- Common mistakes tracking
- Improvement suggestions
- Practice recommendations based on weak areas

### 6. Tournament Mode ⭐ LOW PRIORITY
**Why:** Competitive events, seasonal competitions
**Impact:** Community engagement, retention
**Difficulty:** Hard
**Time:** 8-10 hours

**Implementation:**
- Tournament creation (brackets, elimination rounds)
- Scheduled tournaments
- Leaderboards per tournament
- Prizes/achievements for winners

## V2.1 Quick Wins (Can be done in parallel)

- [ ] Email notifications (race invites, friend requests)
- [x] Custom themes (dark/light/colorful)
- [x] Sound effects toggle per user
- [ ] Keyboard shortcuts (quick navigation)
- [ ] Mobile app improvements (better touch typing)
- [x] Practice mode improvements (custom texts, difficulty levels)

## Implementation Strategy

### Phase 1: Foundation (Week 1)
1. OAuth Authentication
2. User Profiles & Statistics

### Phase 2: Social Features (Week 2)
3. Friend System
4. Private Rooms

### Phase 3: Advanced Features (Week 3-4)
5. Advanced Anti-Cheat
6. Richer Analytics

### Phase 4: Polish (Week 5)
7. Tournament Mode (if time permits)
8. Quick wins

---

## Starting with OAuth Authentication

This is the highest impact feature with good ROI. Let's start here!

