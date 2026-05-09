# V5 architecture notes

This version keeps the course-oriented MVP structure while separating the parts that were previously mixed together.

## Layers

- `services/`: Firebase and GitHub API access only.
- `controllers/`: asynchronous workflows and side effects, such as auth, repository sync, leaderboard subscription, request persistence, and workspace persistence.
- `stores/`: MobX application state split by responsibility.
  - `UiStore`: navigation, notifications, loading, confirmation dialog, selected player.
  - `SessionStore`: signed-in profile.
  - `WorkspaceStore`: repositories, active repository, sync status, cooldown, XP rules, current hero stats.
  - `RequestStore`: repository-specific requests, request metrics, contribution-based request bonuses.
  - `LeaderboardStore`: Firebase leaderboard rows and subscription lifecycle.
- `models/`: domain models and pure scoring logic.
- `presenters/`: map store/controller data into view props.
- `views/`: stateless UI components.

## V5 functional updates

- Repository switching and deletion moved from the sidebar into the sticky top workspace header.
- Repository deletion and request deletion now use a confirmation dialog.
- XP rules are edited in a modal and can be loaded/saved per repository.
- Requests use team-level metrics with start/end dates. When a request is completed, bonus XP is awarded proportionally to the signed-in user's contribution during that request date range.
- Team ranking uses Last 7 days and All time modes, with the selected time range displayed beside the ranking table.
- The profile menu uses fixed positioning so it remains aligned with the sticky header during page scrolling.
