---
title: Ws:Explanation:Readmefeed
sidebar_label: Ws:Explanation:Readmefeed
id: readmefeed
---

```markdown
# src/components/features/feed/ — Feed Video Player Components

**Location:** `deltalabs-frontend/src/components/features/feed/`
**Type:** Feature-Specific UI Components (Feed Domain)

---

## Overview

These are the **shared UI primitives** for the vertical video feed — the TikTok-style
snap-scrolling content player. They are used by the Feed module's views but
designed to be composable and independently testable.

---

## Core Feed Item Components

| Component | Purpose |
|---|---|
| `FeedCard.tsx` | The outer container for a single feed item. Sets dimensions and overflow. |
| `FeedOverlayGradient.tsx` | A CSS gradient overlay at the bottom of each video to make text readable against the video. |
| `FeedCaption.tsx` | The text caption / title of the feed item, shown on top of the video. |
| `FeedHashtagList.tsx` | A row of clickable hashtag chips (e.g. `#react` `#webdev`) for the feed item. |
| `CreatorIdentity.tsx` | The creator's avatar, name, and follow button shown on each feed card. |
| `FeedResourceLink.tsx` | A button/link that opens an external resource associated with the feed content. |

---

## Interaction Components

| Component | Purpose |
|---|---|
| `FeedActionRail.tsx` | The vertical rail of action buttons on the right side of each card: like, comment, share, bookmark. |
| `FeedSnapScrollControls.tsx` | Up/down arrow buttons (or swipe gesture handlers) to navigate between feed items. |
| `FeedSearchInput.tsx` | A search bar specific to the feed — filters or searches feed content. |
| `FeedFilterTrigger.tsx` | A button that opens the filter panel to narrow feed content by category/tag. |

---

## master/ Sub-folder (Complex Overlays)

| Component | Purpose |
|---|---|
| `FeedMedia.tsx` | **Core video/image player.** Handles video buffering, play/pause, loop, progress. The largest and most complex feed component. |
| `FeedViewport.tsx` | The snap-scroll container that holds all `FeedCard` items and manages scroll snapping. |
| `FeedCommentPanel.tsx` | A slide-up panel showing comments for the current feed item. Allows adding new comments. |
| `FeedShareSheet.tsx` | A bottom sheet with share options (copy link, social platforms). |
| `FeedFilterPanel.tsx` | The full filter panel that slides in, with category/tag filter options. |
| `FeedStatePanel.tsx` | An overlay shown when the feed is loading, has no more items, or has an error. |
| `FeedAuthGateModal.tsx` | A modal shown to unauthenticated users when they try to like/comment, prompting them to log in. |

---

## index.ts

Re-exports all feed components for clean imports.

---

## Mental Model

Imagine a TikTok-style video screen. Break it apart into every visible piece:
the video itself, the caption, the like button, the comment section — each of those
is a separate component in this folder. The `FeedViewport` is the screen; everything
else is stuck to the front of it.
```
