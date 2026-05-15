# Brainrot Frontend Design System

> Single source of truth for visual language and component behavior in the `ui_design/` prototype. Token names map 1:1 to the eventual Tailwind v4 `@theme` block in S1.

## 1. Principles

1. **Restraint over decoration.** Default to paper + ink. Color enters only as a deliberate accent or as part of the status master table (§6). No gradients in core surfaces.
2. **Form over color for status.** Status is signalled by *shape* (hollow square / filled / pulse / dashed / striped) first, color second. This is the rule that ended the prior "color the icons → ugly → revert" loop. Nav icons stay monochrome — they do NOT carry colored chips.
3. **Paper feel.** Surfaces are warm white (Moonlit Cream), borders are hairline (1px), shadows are solid-offset block-style not blur.
4. **Variable type as voice.** Bricolage Grotesque's `wdth` axis is used intentionally: confident headlines tighten to 88; CTA buttons widen to 96; body stays at 100.

## 2. Palette

(filled in Task 4)

## 3. Typography

(filled in Task 3)

## 4. Spacing / Radii / Shadow

(filled in Task 3)

## 5. Component visual specs

(filled in Task 4; locks the six layout fixes)

## 6. Status semantics master table

(filled in Task 4)

## 7. Tweaks panel & persistence

Tweaks panel writes four values to `localStorage`:

| Key | Type | Default | Notes |
|---|---|---|---|
| `brainrot.tweaks.accent` | hex string | `#cf4040` (poppy) | one of poppy/moss/honey/plum |
| `brainrot.tweaks.density` | enum | `cozy` | `compact` \| `cozy` \| `airy` |
| `brainrot.tweaks.blockDepth` | int | `4` | `0..8` px, drives `--shadow-current` |
| `brainrot.tweaks.theme` | enum | `light` | `light` \| `dark`; dark values blank in S0 |

Reads happen once on boot in `app-cream.jsx`; writes happen in `tweaks-panel.jsx`.

## 8. Dark theme placeholder

(filled in Task 3)

## 9. Tailwind v4 mapping

(filled in Task 3)

## 10. Acceptance checklist (S0 → S1 gate)

S0 is done only when every box is checked. Any unchecked item blocks S1.

**Design system**
- [ ] DESIGN.md 10 sections complete
- [ ] tokens/*.css 8 files in place; tokens-cream.css is now just @import lines
- [ ] Status semantics master table in §6
- [ ] Tweaks persistence keys in §7
- [ ] Dark token placeholder table in §8 (values blank)
- [ ] Tailwind v4 mapping table in §9

**Code organization**
- [ ] chat/ split into MessageList, MessageItem, Composer, MentionList, ApprovalCard + 8 parts
- [ ] screens/ 13 files (5 existing + 8 new)
- [ ] lib/ 5 JS utilities
- [ ] index v2.html updated; console 0 errors on load
- [ ] Old chat.jsx and screens.jsx deleted

**Four core interactions**
- [ ] @mention all 8 keyboard cases pass
- [ ] mention chip deletes as one unit
- [ ] no-match popover shows message
- [ ] tool_use without result shows skeleton + "运行中"
- [ ] is_error tool_result shows red border
- [ ] tool_result >10 lines folds
- [ ] approval countdown driven by expires_at (not local-accumulated)
- [ ] approval <10min red bleed
- [ ] approval at 0 disables buttons + dims card
- [ ] queued badge shown when metadata.queued
- [ ] cancel-run confirms + warns about queued
- [ ] cancel-run 5s debounce

**Layout fixes (6)**
- [ ] hero "新建项目" no wrap
- [ ] stat 2×2 aligned with right rail baseline
- [ ] stat cards near-square
- [ ] sidebar "runtime 在线" no truncation
- [ ] project card title no per-char break
- [ ] sidebar icons monochrome

**Six missing pages**
- [ ] Login / Register fillable, validation works
- [ ] AgentsList with search + archive filter
- [ ] AgentNew full field set incl. mcp_config validation
- [ ] RuntimesList + install-token modal (one-time token + copy + countdown)
- [ ] WorkspaceSettings members + danger zone (slug-typed confirm)
- [ ] ProjectAssets + ProjectArtifacts tabs
- [ ] /approvals hub uses ApprovalCard

**lib/ tests**
- [ ] tests/lib.html opens with all assertions green
