---
title: Ws:Explanation:Readmefeedmodule
sidebar_label: Ws:Explanation:Readmefeedmodule
id: readmefeedmodule
---

````markdown
# src/modules/Feed/ — Feed Module

**Location:** `deltalabs-frontend/src/modules/Feed/`
**Domain:** Vertical snap-scroll video/content feed

---

## What It Does

Powers the **core content discovery experience** of DeltaLabs — a TikTok-style
vertical feed of educational videos, tutorials, AI demos, and audio content.
Users scroll through content, interact (like, comment, share), and discover courses.

---

## api/ → `index.ts`

All backend API calls for the feed:
- `fetchFeedPosts(params)` — GET paginated list of feed posts (filtered by category, search, etc.).
- `likeFeedPost(postId)` — POST to like/unlike a post.
- `fetchComments(postId)` — GET comments for a post.
- `addComment(postId, text)` — POST a new comment.
- `shareFeedPost(postId)` — POST to record a share event.
- `bookmarkFeedPost(postId)` — POST to bookmark/unbookmark.

---

## hooks/

### `useFeedQueries.ts`
TanStack Query `useQuery` and `useMutation` wrappers:
- `useFeedPosts(filters)` — infinite scrolling query for the feed.
- `useLikePost()` — mutation to toggle like, with optimistic update.
- `usePostComments(postId)` — query for comments.
- `useAddComment()` — mutation to add a comment.
- `useBookmarkPost()` — mutation for bookmarking.

### `feedQueryKeys.ts`
Query key factory for the feed:
```typescript
feedQueryKeys.posts(filters)    // → ['feed', 'posts', filters]
feedQueryKeys.comments(postId)  // → ['feed', 'comments', postId]
```

---

## context/ → `index.ts`

A module-scoped `FeedPlayerContext` that manages which post is currently visible
and playing. Coordinates between the viewport component (which detects scroll
position) and the media player (which plays/pauses based on visibility).

---

## data/ (Mock Data)

### `mockVideoFeed.ts`
An array of fake feed post objects for development and Storybook. Allows working
on the feed UI without needing real backend data.

### `mockComments.ts`
Fake comment arrays for testing comment UI.

### `landingFeedPresenter.ts`
A small data transformer that takes raw feed API data and formats it for display
on the landing page's feed preview section.

---

## features/layout/

### `FeedLoadingState.tsx`
A skeleton/spinner component shown while the feed is initially loading.

### `FeedWorkerHealthDebugPanel.tsx`
A developer-only debug panel (hidden in production) showing the health of any
Web Workers used for feed pre-fetching. Useful during development.

---

## routing/

### `routing/guards/index.ts`
Guard function that checks if the current user can access the full feed
(e.g. requires login for certain interactions).

### `routing/hooks/index.ts`
Hooks for navigating within the feed (e.g. programmatically jumping to a
specific post by ID).

---

## utils/ → `index.ts`

Utility functions specific to the feed:
- Formatting view counts (e.g. `12400` → `"12.4K"`).
- Calculating video duration display strings.
- Sorting/filtering logic for feed items.

---

## views/

| View | Purpose |
|---|---|
| `LandingPageView.tsx` | **The main landing page** — hero section, animated feed preview, feature highlights, CTAs. The largest file in the project. |
| `FeedExplorerShell.tsx` | The authenticated feed experience shell — renders the `FeedViewport` with snap-scroll. |
| `ExploreAllView.tsx` | A grid-based browse view of all available feed content (not snap-scroll). |
| `AIExplorerView.tsx` | The `/ai` page — showcases AI-powered content and tools. |
| `AudioHubView.tsx` | The `/audio` page — audio-format educational content. |
| `SimulationHubView.tsx` | The `/simulation` page — interactive simulation content. |

### Test Files in views/
- `LandingPageView.test.tsx` — Renders the landing page and checks key sections appear.
- `AuthFlows.test.tsx` — Integration tests for auth modal triggers within the feed.

---

## Mental Model

The Feed module is the "YouTube homepage" of DeltaLabs — the place users land to
discover content. `data/` is the content, `hooks/` is the fetch engine,
`views/` is the TV screen, `components/features/feed/` (outside this module)
are the TV's individual buttons and dials.
````
