# Skill Points Prototype V1.3

A Coursera-style learning experience prototype that explores **Skill Points (XP)** — a gamification system for learner engagement and progress visualization.

**Live prototype:** [m1-skills-prototype.vercel.app](https://m1-skills-prototype.vercel.app)

---

## Features

### Skill Points (XP) System
- **XP earned per item** — Video and reading completions, practice assignments, and graded assignments award Skill Points
- **Retroactive credit** — Active learners receive XP for prior progress on arrival
- **Contextual introduction** — XP is revealed on first completion, not upfront
- **Video-end feedback** — Completion modals show XP earned and skill progress
- **Practice feedback** — Assignment feedback modals display per-item XP and skill attribution

### Learner Segments
- **Active Enrolled** — Currently taking a course; sees retroactive XP, no intro modal
- **New Learner** — First-time experience; commitment screen on enrollment, XP discovered on first completion

### Course Content
- **Share Data Through the Art of Visualization** — Full 4-module structure
- **Module 1:** Visualize data (Communicate insights, Understand visualization, Design visualizations, etc.)
- **Module 2:** Create data visualizations with Tableau
- **Module 3:** Craft data stories
- **Module 4:** Develop presentations and slideshows + Course wrap-up

### Daily Goals
- 8 learning items + 1 practice item + Coach usage
- Progress shown in header and goals-complete modal
- Streaks integration (toast on session start when applicable)

### My Learning
- Skills tab with "Coming soon" empty state (XP coin, Explore content CTA)
- Course recommendations and progress overview

### Proto Controls (Engineers)
- **Show differences** — Toggle (bottom-left) highlights net-new elements with a red outline. Available on homepage, learning, and My Learning. State persists via sessionStorage across navigation.

### Email Templates
- **Active learner** — Announcement email (active-email.html)

---

## Project Structure

```
├── index.html         # Segment selection (Active / New)
├── homepage.html      # Home page with goals, recommendations
├── learning.html      # Course learning view (video, sidebar, XP)
├── my-learning.html   # Skills and course overview
├── active-email.html  # Announcement email template
├── css/               # Styles (CDS tokens, components)
├── js/                # App logic (XP, goals, modals)
└── vercel.json        # Deployment config and route rewrites
```

---

## Getting Started

### Option 1: Open directly
Open `index.html` in your browser. Select a learner segment to preview different experiences.

### Option 2: Run with dev server
```bash
npm start
```
Then visit http://localhost:3456

### Option 3: Deploy to Vercel
```bash
vercel --prod
```

---

## Tech Stack

- HTML5, CSS3 (custom properties, flexbox)
- Vanilla JavaScript
- [Coursera Design System (CDS)](./cds-styling-spec.md) tokens and components
- [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) font
- [Material Symbols Rounded](https://fonts.google.com/icons?icon.style=Rounded) icons

---

*For internal review only — Skill Points Prototype V1.3*
