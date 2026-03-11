# Skill Points Introduction Strategy

**Feature:** Skill Points (XP) system for Coursera
**Status:** Brainstorm / Pre-planning
**Last updated:** Feb 27, 2026

---

## 1. Context

We are introducing a Skill Points (XP) system that ties learning activity to measurable skill progression. Every learning item (video, reading, practice, assignment) earns XP toward specific skills, and learners can track their skill levels (Practicing, Developing, Comprehending) across courses.

This document covers how we introduce this feature to learners — specifically, the introduction experience, sequencing, and interaction with existing gamification mechanisms.

---

## 2. Learner Segments

Three distinct groups will encounter Skill Points for the first time, each with different context and expectations.

### 2a. Active Enrolled Learners

Learners currently in the middle of a course or certificate program.

**Key characteristics:**
- Already have a learning habit and mental model of the platform
- May resist disruption to their existing flow
- Career-focused learners (e.g., Google Certificate) are outcome-oriented, not points-oriented

**Introduction approach:**
- Contextual reveal after first completion — not an upfront modal before they've done anything. The highest-impact moment is right after they complete an activity post-launch. They finish a video and see: "You earned 15 XP in Data Visualization."
- Retroactive XP credit is critical. If someone is 80% through a course and starts at 0 XP, the system contradicts their lived experience and erodes trust immediately.
- Progressive disclosure of depth: Day 1 they see XP on completions. Day 2-3 daily goals surface. Week 2 skill levels become visible in My Learning. Don't dump XP + goals + streaks + skill levels all at once.

**Risks:**
- Intrinsically motivated learners may find XP patronizing. Consider a non-intrusive mode (small toast, not a blocking modal).
- Career-focused professionals may see gamification as trivializing their effort. Frame everything as "skills and career relevance" not "points."

### 2b. Lapsed / Not Currently Enrolled

Learners who previously used Coursera but aren't actively learning.

**Key characteristics:**
- Left for a reason — XP alone won't bring them back
- But XP can reframe their past investment and lower the return barrier

**Introduction approach:**
- "Your skills are waiting" re-engagement via email/push: "You've built 120 XP in SQL Fundamentals. You're 80 XP from reaching Developing level."
- Lead with skills, not points. Lapsed learners care about career outcomes, not gamification. "You've started building 3 in-demand skills" beats "You have 120 XP."
- Low-commitment re-entry: "Complete 1 item today to keep your SQL skill active" is less daunting than "Resume your 8-week course."

**Risks:**
- If they return and see no retroactive credit, or if XP feels like a gimmick on top of the same experience they abandoned, they'll churn again faster.

### 2c. New Learners (First-time)

People with no prior Coursera experience.

**Key characteristics:**
- No existing mental model to disrupt — easiest segment
- But also the most sensitive to cognitive overload during onboarding

**Introduction approach:**
- Don't lead with XP during onboarding. First priority: find a course, understand Coursera, start learning. XP should be a discovery after their first completion, not a feature pitch before they've done anything.
- "Learn by earning" — they complete their first video, a small animation shows "+15 XP in Data Literacy." The pattern is self-evident. After 2-3 completions, a gentle tooltip explains skill levels and daily goals.
- Empty state should motivate, not intimidate: "Complete your first lesson to start building skills" — not a wall of empty progress bars.

**Risks:**
- New learners who see XP prominently might anchor on it as the purpose of the platform (optimizing for XP rather than actual learning). Make sure framing is "skills you're building" not "points you're collecting."

---

## 3. Existing Gamification: Weekly Streaks

### Current state

Coursera already has a **weekly streak** system:
- A learner must complete X learning sessions in a week to maintain their streak.
- The current threshold is 3 days per week (this is being A/B tested — the team may change the required number of days).
- Even completing a single day triggers a toast notification: e.g., "Monday complete."
- Streaks are a retention mechanic tied to weekly consistency.

### Why this matters for Skill Points introduction

Skill Points introduces **additional** feedback moments on top of an already active notification system. We need to think about Skill Points as an addition to an existing gamification layer, not as the only system in play.

---

## 4. The Notification Collision Problem

### The scenario

A learner comes back after we launch Skill Points. They complete their first item. What happens:

1. **Skill Points pop-up:** "You earned 15 XP in Data Visualization" (new — the introduction moment)
2. **Daily streak toast:** "Monday complete" (existing — streak system)
3. Potentially: **Daily goal progress** toast (new — if goals are active)
4. Potentially: **Video end modal** with XP breakdown (new)

That's 2-4 notifications stacking on a single completion action. This is a terrible first impression of the feature and creates notification fatigue.

### Principles for resolution

**Principle 1: One celebratory moment per action, not many.**
A single completion should trigger one cohesive feedback moment, not a cascade of independent notifications competing for attention.

**Principle 2: Hierarchy of importance.**
Not all feedback is equally important. We need a priority system:

| Priority | Notification | Type | When to show |
|----------|-------------|------|--------------|
| 1 (highest) | Skill XP earned | Modal or inline | On every completion (the core new value) |
| 2 | Goal progress / Goal complete | Toast | After XP modal dismisses or auto-clears |
| 3 | Daily streak ("Monday complete") | Toast | Only if no other notification is active |
| 4 | Module / course milestones | Modal | On milestone completion only |

**Principle 3: Queue, don't stack.**
If multiple notifications must fire, they should queue sequentially with appropriate delays, not stack or overlap. The most important one (Skill XP) shows first; secondary ones (streak) appear only after the primary one is dismissed or auto-clears.

**Principle 4: Keep systems decoupled.**
Merging notifications from different systems (XP, streaks, goals) into a single consolidated UI is tempting but introduces tight coupling between independently owned features, increases tech debt, and makes each system harder to iterate on or A/B test independently. Each system should own its own notification; a shared queue layer handles sequencing.

### Recommended approach: Priority Queue

Keep notifications from each system separate but enforce strict sequencing through a shared notification queue. Each system fires its notification independently; the queue ensures only one shows at a time and respects priority order.

**How it works:**

| Step | What happens | Timing |
|------|-------------|--------|
| 1 | Learner completes an item | — |
| 2 | Skill XP modal/toast fires (highest priority) | Immediate, shows for 3-4 seconds or until dismissed |
| 3 | Goal progress toast fires (if applicable) | After XP notification clears, 2-3 second display |
| 4 | Streak toast fires (if applicable, e.g., "Monday complete") | After goal toast clears, 2 second display |

**Rules:**
- Maximum 2 notifications per completion action. If all three would fire, the lowest-priority one (streak) is suppressed for that action and does not re-queue.
- Modals (like video end or module complete) take full priority — no toasts fire while a modal is open. Queued toasts fire after the modal is dismissed.
- On the learner's very first encounter with Skill Points, consider suppressing all non-XP notifications so the introduction moment gets full attention.

**Why this approach:**
- Each feature team (XP, streaks, goals) owns and iterates on their own notification independently.
- No refactoring of existing streak or completion flows required — only a lightweight shared queue layer.
- Easy to adjust priority order, timing, or max-cap as we learn from data.
- A/B testing any individual notification system doesn't require changes to the others.

### Alternative considered but not recommended

**Unified completion moment (consolidation):** Merging XP, skill progress, goal status, and streak feedback into a single combined UI. While this gives a cleaner single-notification experience, it tightly couples independently owned systems, increases tech debt, and makes each feature harder to modify or test in isolation. Not recommended given the current stage and the fact that streaks are still being A/B tested independently.

### Open question for the team

How does the streak system team feel about consolidating the "Monday complete" toast into a broader daily progress view? If streaks are being A/B tested anyway, this might be an opportunity to rethink how streak feedback is delivered — especially since Skill Points daily goals overlap conceptually with streak mechanics (both reward daily consistency).

---

## 5. Retroactive XP Credit

### Status: Needs technical investigation

This is the single highest-impact decision for the introduction experience. The question: can we calculate and award XP for all past completions at launch?

### Why it matters

| Scenario | Impact |
|----------|--------|
| Full retroactive credit | Active learners see "You've already earned 340 XP across 3 skills" on first visit — instant credibility and delight |
| Approximate credit | "Based on your completed courses, you've built skills in Data Analytics and SQL" — less precise but still acknowledges past work |
| No retroactive credit | Learner who is 80% through a certificate starts at 0 XP — system feels broken, trust erodes |

### Recommendation

Even if full granular backfill is technically hard, find a way to do approximate retroactive credit. The precision matters less than the acknowledgment. "You've earned ~200 XP in Data Analytics" is vastly better than zero.

### Impact on introduction by segment

- **Active learners:** Retroactive credit turns the introduction from a pitch ("here's a new feature") into a reveal ("look what you've already built"). This is significantly more powerful.
- **Lapsed learners:** Retroactive credit enables the strongest possible re-engagement message — real numbers, real skills, real progress waiting for them.
- **New learners:** Not applicable (they have no history).

---

## 6. A/B Testing Strategy

### Recommended tests (sequential, not simultaneous)

#### Test 1: Introduction moment

| Variant | Description |
|---------|-------------|
| A: Upfront modal | Current prototype approach — modal on homepage announcing Skill Points before any action |
| B: Post-completion reveal | No upfront announcement. XP appears for the first time after completing an activity |
| C: Hybrid | Small banner on homepage ("New: Skill Points"), full experience revealed on first completion |

**Measure:** Feature awareness (survey), completion rate in first 7 days, dismiss-without-engagement rate.

**Hypothesis:** B or C will outperform A. Upfront modals have high dismiss rates and low information retention. Contextual reveals at the reward moment have much higher "aha" conversion.

#### Test 2: Depth of gamification

| Variant | Description |
|---------|-------------|
| A: XP only | Just show XP earned per activity. No goals, no streaks, no levels. |
| B: XP + Daily Goals | XP plus the 3 daily goals (8 learning items, 1 practice item, Coach) |
| C: Full system | XP + Goals + Skill Levels + all feedback loops |

**Measure:** 30-day retention, completion rates, daily active usage, goal completion rates.

**Hypothesis:** B will be the sweet spot. XP alone lacks structure. The full system risks cognitive overload. Daily goals create the right amount of structure.

### Critical: run tests long enough

Gamification features almost always show a novelty spike in weeks 1-4, then either sustain or collapse. Tests must run for **at least 6-8 weeks** to see past the novelty effect. Many teams ship based on 2-week results and then see metrics regress.

---

## 7. Metrics Framework

### Primary metrics (does XP help learning outcomes?)

- Course completion rate
- 7-day and 30-day retention
- Items completed per session

### Secondary metrics (is the system engaging?)

- Daily goal completion rate
- Session frequency
- Re-enrollment rate (do they start another course?)
- Coach usage rate (does the goal drive Coach adoption?)

### Guardrail metrics (are we causing harm?)

- Time-to-first-drop — are people burning out faster?
- Content quality ratings — are they rushing through for XP?
- Support tickets and negative sentiment
- Streak maintenance rate — is the new system interfering with existing streak behavior?

---

## 8. Phased Rollout Recommendation

| Phase | Segment | Timing | Why this order |
|-------|---------|--------|----------------|
| 1 | Active enrolled learners (A/B test) | Weeks 1-8 | Easiest to measure (existing baseline), most forgiving (they already like Coursera), fastest signal |
| 2 | New learners | Week 9+ | Incorporate Phase 1 learnings into onboarding flow |
| 3 | Lapsed re-engagement | Week 12+ | Use Phase 1 data to craft compelling re-engagement with real XP numbers |
| 4 | Full rollout | Week 16+ | All segments, optimized based on test results |

---

## 9. Open Questions

1. **Retroactive XP:** Is backfilling XP for past completions technically feasible? What level of granularity can we achieve? (Needs engineering investigation)

2. **Streak interaction:** What is the current confirmed threshold for weekly streaks? (Was 3 days, may have changed via A/B test.) Who owns the streak system, and are they aligned on potential changes to streak notification behavior?

3. **Notification governance:** Is there a platform-level notification/toast system, or does each feature team manage their own? We need a unified notification queue to prevent stacking.

4. **Daily goal calibration:** The prototype uses 8 learning items + 1 practice item + Coach usage. How were these numbers chosen? Do we have data on average items completed per session to validate these are achievable-but-stretching?

5. **Skill mapping completeness:** How many courses currently have skill-to-content mapping? If a learner is in a course that hasn't been mapped, what do they see?

6. **Overlap between daily goals and weekly streaks:** Both reward daily consistency. Should daily goals eventually *replace* streaks, or do they serve different enough purposes to coexist? This needs a clear stance before launch.

7. **Completers/alumni introduction trigger:** Learners who have already finished their course or certificate have no active enrollment and nothing left to complete. The introduction modal is triggered by completion — but that trigger is unavailable for this group. How do they encounter Skill Points? This is distinct from the retroactive XP question (#1) — retroactive credit is about *awarding* past work, this is about the *mechanism* for introducing the feature when the completion trigger can't fire. Options include a banner on My Learning, an in-app message on next visit, or an email/push notification with a deep link to a skill summary page.

8. **Skill mastery celebration:** When a learner earns all available XP for a specific skill and reaches the top level, what happens? This is a significant milestone that deserves a deliberate celebration moment. Questions to resolve: What does the learner see — a special modal, animation, or badge? Is there a shareable credential or certificate tied to skill mastery? Does the skill "lock in" permanently or can it decay over time without continued activity? What's the learner's next goal after reaching the top level — is there a post-mastery experience, or does the system direct them toward other skills?

---

## 10. Prototype Implementation: First-Time Introduction

### Decision: Big modal on first completion (not a full-screen interstitial)

When a learner completes their first item after Skill Points launch, they see a **medium-sized modal** (568px, CDS dialog sizing) that introduces the concept. This applies to all three segments — active, lapsed, and new.

**Why a modal instead of a full-screen interstitial:**
- Consistent with existing prototype patterns (video end modal, assignment feedback modal)
- Less disruptive — the learner can see the learning page behind the overlay, maintaining context
- Sufficient space for the key message (4 skill rows with XP bars, level badges, explainer text)
- Dismissable with close button or backdrop click — learner stays in control

**Why not the small video-end panel:**
- Too small to introduce a new concept meaningfully (only fits 1 skill row, no room for explanation)
- First-time introduction is a one-time moment that deserves dedicated attention

### Content by segment

| Segment | Title | Subtitle |
|---------|-------|----------|
| Active enrolled | "Introducing Skill Points!" | "Every learning item you complete earns XP toward real, employer-valued skills." |
| Lapsed | "Welcome back — meet Skill Points!" | "You already have progress! Every item you complete earns XP toward real skills." |
| New learner | "You just earned Skill Points!" | "Every learning item you complete earns XP toward real, employer-valued skills." |

The modal shows 4 skill rows (matching the course's skill mapping) with XP progress bars, level badges (Practicing/Developing/Comprehending), and a "Continue learning" CTA.

### Pre-completed items for active/lapsed learners

To simulate retroactive credit, the prototype pre-marks the first 4 sidebar items (m1-l1 through m1-l4) as completed for active and lapsed learners. The learner starts on m1-l5 ("Design principles for clear dashboards"), making the next completion their first post-launch action and the trigger for the introduction modal.

### Commitment screen skills foreshadowing (new learners only)

The "My commitment" enrollment screen includes a new line: *"As I complete items, I'll build real skills — tracked with **Skill Points** — that I can show to employers."* This foreshadows the system before the learner encounters it, aligning with the "discover by earning" approach (no details, just a hint).

### Homepage banner decisions

**Active enrolled — banner removed.** The prototype originally included a blue banner on the homepage for active learners: *"You've been earning Skill Points! … 340 XP across 3 skills"* with a "See your skills" link to My Learning. This was removed because:
- It front-runs the contextual discovery moment. The strategy (Section 2a) calls for a reveal after first completion, not a pitch before the learner has done anything post-launch.
- The "See your skills" link sent learners to My Learning, completely bypassing the introduction modal. They'd see XP data with no explanation of what it means.
- The intro modal already shows retroactive credit with full context (skill rows, level badges, explainer text). The banner was doing the modal's job, but worse — one sentence instead of a full introduction.

**Lapsed — banner kept.** The purple banner (*"Your skills are waiting — you've built 310 XP across 3 in-demand skills"*) is retained because it serves a distinct re-engagement purpose (Section 2b). Its link goes to `learning.html` where the intro modal can still fire on completion, so the introduction path remains intact.

**New learners — no banner (unchanged).** Discovery happens through the completion flow, per Section 2c.

### Subsequent completions

After the first-time modal is dismissed (tracked via `sessionStorage` key `m1-skills-xp-intro-shown`), all further completions use the standard video-end panel or assignment feedback modal with per-item XP display.

---

## 11. Key Risks Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Notification overload from XP + streaks + goals stacking | High | Unified completion moment or priority queue (Section 4) |
| No retroactive credit makes system feel broken for active learners | High | Invest in at least approximate backfill (Section 5) |
| Novelty effect inflates early A/B test results | Medium | Run tests for 6-8 weeks minimum (Section 6) |
| Career-focused learners reject gamification as patronizing | Medium | Frame as skills/career progress, not points. Consider quiet mode. |
| XP optimization replaces actual learning as the goal | Medium | Guardrail metrics on content quality ratings and rushing behavior |
| Streak system team not aligned on notification changes | Medium | Cross-team alignment meeting before implementation |
