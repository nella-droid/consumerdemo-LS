# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-03-06

### Added
- **Show differences** toggle — Proto control (bottom-left) highlights net-new elements with red outline for engineers; available on homepage, learning, and My Learning
- Net-new highlights: skill tags, sidebar XP tracker, XP/skills intro dialogs, skill cards (assessment, module complete, goals complete, video end), module/goals complete dialogs, Skills tab, early access dialog, day 1 commitment card
- Sidebar: clickable number + XP opens skills intro modal (label "Today's Skill points" is static)
- Certificate.svg asset

### Changed
- Footer version text updated from V1.2 to V1.3
- Removed lapsed learner prototype flow (segment card, homepage banner, re-engagement email)
- Removed skill cards from Skills tab (My Learning)
- Added "Coming soon" empty state to Skills tab (XP coin illustration, header, subtext, Explore content CTA)
- Dialog improvements: 32px padding, max-height calc(100vh - 64px), 4px header-to-subtext gap, 32px CTA bottom padding, no fixed height
- Net-new highlight: red outline only (removed tint fill to avoid dialog overlap)

### Fixed
- Dialog layout and spacing consistency across all modals

---

## [1.0.0] - Initial

### Added
- Current LEX v1.0 Prototype - Coursera-style learning experience
- Static site served via `npx serve` on port 3456
