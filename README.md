# GitHub Hero Quest 🎮

> Turn GitHub collaboration into an RPG-style progress tracker: sync repository activity, earn XP for commits, pull requests, and reviews, create team goals, and compare progress on a live team leaderboard.

## Live Demo

**Running web app:**  
https://ch4you.github.io/dh2642-github-hero-quest/

Sign in with GitHub and connect any public repository to get started.

## GitHub Repository

**Repository:**  
https://github.com/Ch4you/dh2642-github-hero-quest

---

## Group Participants

| Name | Canvas ID |
|---|---:|
| Yu Zhang | 198594 |
| Rui Zhang | 198743 |
| Changhe You | 201172 |

---

## Project Setup

### Prerequisites

- Node.js 18+
- A GitHub account
- A Firebase project with Firestore and Authentication enabled

### 1. Clone and install

```bash
git clone https://github.com/Ch4you/dh2642-github-hero-quest.git
cd dh2642-github-hero-quest
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

These values can be found in Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration.

### 3. Enable Firebase services

In Firebase Console:

- Authentication → Sign-in method → enable GitHub
- Firestore Database → create a database

For GitHub OAuth, register an OAuth App at:

https://github.com/settings/developers

Then paste the GitHub Client ID and Client Secret into Firebase Authentication settings.

### 4. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## How to Use

1. Sign in with GitHub.
2. Connect a public GitHub repository by entering `owner/repo`, for example `octocat/Hello-World`.
3. Click **Sync** to load GitHub activity.
4. Create team goals based on GitHub metrics such as commits, merged pull requests, and reviews.
5. Track the latest active goal and repository summary on the Dashboard.
6. Check **Team ranking** to compare synced teammates by XP.
7. Use **Workspace** to switch repositories and edit repository-specific XP rules.

---

## Main Features

### Dashboard

The Dashboard gives a concise overview of the selected repository. It shows:

- the signed-in user's XP and XP source breakdown,
- synced teammates and contributor status,
- active team-goal progress,
- repository merged pull request information,
- and quick access to goal creation and detail dialogs.

The Dashboard is designed as a summary page instead of a duplicate of Team ranking or Manage goals. Detailed goal and ranking actions are available through their own pages or dialogs.

### Manage Goals

Users can create and manage team goals based on GitHub activity.

Supported goal states include:

- Scheduled
- Active
- Completed
- Expired

The goal flow supports:

- creating goals,
- saving a draft,
- editing goals,
- deleting goals,
- viewing goal details,
- manually completing a goal,
- checking member contribution for a goal,
- and tracking goal progress based on GitHub metrics.

### Repository Workflow / Workspace

Users can connect public GitHub repositories and switch between saved repositories. The Workspace page includes recent repositories, connected repositories, and repository-specific XP rules.

Repository-related errors are shown as user feedback instead of blocking unrelated actions. Recent repository loading is treated as an auxiliary workflow, so users can still paste a public repository manually.

### Team Ranking

The Team ranking page compares synced contributors for the selected repository. Users can:

- compare all-time XP,
- compare last-7-days XP,
- search teammates,
- open a player detail drawer,
- and inspect XP sources using the active repository's scoring rules.

### XP Rules

XP rules define how many points different GitHub actions are worth. Commits, merged pull requests, open pull requests, and reviews can each have different XP values.

XP rules are repository-specific, so different repositories can use different scoring standards.

### GitHub and Firebase Integration

The app uses GitHub data to calculate contribution activity and Firebase to persist workspace state, goal state, score rules, progress, and leaderboard rows. Cached Firebase data is used when recent enough or when GitHub rate limits prevent new requests.

---

## Architecture

The project follows a Model-View-Presenter / MVC-inspired structure. The main concerns are separated into MobX application state, controllers, external services, presenters, and views.

```text
src/
├── App.jsx
├── main.jsx
├── styles.css
│
├── models/
│   ├── AppStore.js
│   ├── HeroModel.js
│   ├── QuestModel.js
│   ├── fireModels.js
│   └── scoreRules.js
│
├── stores/
│   ├── StoreProvider.jsx
│   ├── UiStore.js
│   ├── SessionStore.js
│   ├── WorkspaceStore.js
│   ├── RequestStore.js
│   └── LeaderboardStore.js
│
├── controllers/
│   ├── AuthController.js
│   ├── RepositoryController.js
│   ├── LeaderboardController.js
│   └── QuestController.js
│
├── services/
│   ├── firebaseService.js
│   └── githubApi.js
│
├── presenters/
│   ├── RootPresenter.jsx
│   ├── ShellPresenter.jsx
│   ├── DashboardPresenter.jsx
│   ├── QuestPresenter.jsx
│   ├── LeaderboardPresenter.jsx
│   ├── ConnectRepoPresenter.jsx
│   ├── LoginPresenter.jsx
│   ├── SetupPresenter.jsx
│   └── AboutPresenter.jsx
│
├── views/
│   ├── AppShellView.jsx
│   ├── QuestDashboardView.jsx
│   ├── QuestConfiguratorView.jsx
│   ├── LeaderboardView.jsx
│   ├── ConnectRepoView.jsx
│   ├── LandingView.jsx
│   ├── SetupView.jsx
│   ├── AboutView.jsx
│   ├── dashboard/
│   │   ├── ActiveGoalsListView.jsx
│   │   ├── DetailModalView.jsx
│   │   ├── MergedPullRequestTableView.jsx
│   │   ├── RepositoryRequiredOverlayView.jsx
│   │   ├── TeammatesTableView.jsx
│   │   └── XpSourcesView.jsx
│   ├── goals/
│   │   ├── GoalDetailModalView.jsx
│   │   ├── GoalFormModalView.jsx
│   │   ├── GoalStatusCardsView.jsx
│   │   ├── GoalStatusInfoView.jsx
│   │   └── GoalTableView.jsx
│   ├── shared/
│   │   ├── InfoTip.jsx
│   │   ├── formatters.js
│   │   └── goalStatus.js
│   └── shell/
│       ├── ConfirmationDialogView.jsx
│       └── HeaderRepositoryMenuView.jsx
│
├── components/
│   ├── common/
│   │   ├── InfoTip.jsx
│   │   ├── MetricCard.jsx
│   │   ├── PlayerDrawer.jsx
│   │   └── StatusPill.jsx
│   └── ui/
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── loading-spinner.jsx
│       ├── progress.jsx
│       ├── sheet.jsx
│       ├── tabs.jsx
│       └── utils.js
│
└── hooks/
    └── useClickOutside.js
```

### Separation of concerns

- **Models** contain domain models, score rules, the root `AppStore`, and Firebase mapping helpers.
- **Stores** contain MobX application state and application-state side effects. `UiStore`, `SessionStore`, `WorkspaceStore`, `RequestStore`, and `LeaderboardStore` own state updates and persistence actions.
- **Controllers** coordinate user workflows such as authentication, repository syncing, leaderboard loading, and goal handling. Controllers call store actions instead of directly owning Firebase write side effects.
- **Services** contain external API adapters. `firebaseService.js` contains Firestore/Auth read, write, and subscription functions. `githubApi.js` contains GitHub REST API requests and GitHub error normalization.
- **Presenters** read MobX state, derive view props, keep short-lived UI form state, and pass callbacks to views.
- **Views** render the interface from props and callbacks. Views do not import MobX stores, Firebase services, or GitHub services directly.

Firebase data conversion is centralized in `models/fireModels.js`. Firestore read/write functions are kept in `services/firebaseService.js`, while GitHub API calls are kept in `services/githubApi.js`.

---

## MobX State Management and Persistence Ownership

The app uses MobX as the state manager and configures strict action mode in `main.jsx`:

```js
configure({ enforceActions: 'always' });
```

Each store uses `makeAutoObservable(..., { autoBind: true })`, so store methods are MobX actions.

Application-state persistence is owned by MobX store actions, not by plain controller classes. The persistence actions include:

| Store | Persistence actions |
|---|---|
| `SessionStore` | `persistAuthProfile`, `persistMissingUsernameProfile` |
| `WorkspaceStore` | `persistWorkspace`, `persistUserProgress`, `persistWeeklyUserProgress`, `persistScoreRules`, `persistMergedPRDetails`, `persistRepositoryContributors` |
| `RequestStore` | `persistRequests`, `persistRequestMetrics` |

Controllers may decide when a workflow should save or sync, but the actual Firebase write side effects go through the store layer. For example:

- repository connection updates `WorkspaceStore` state, then calls `store.persistWorkspace(...)`;
- XP sync updates `WorkspaceStore.hero`, then calls `store.persistUserProgress(...)`;
- goal creation updates `RequestStore.requests`, then calls `store.persistRequests(...)`;
- goal metric sync updates `RequestStore.requestMetricsById`, then calls `store.persistRequestMetrics(...)`;
- contributor and merged-PR cache writes go through `WorkspaceStore.persistRepositoryContributors(...)` and `WorkspaceStore.persistMergedPRDetails(...)`.

This keeps the application state side effects inside the state manager while the Firebase service remains a low-level API adapter.

---

## Third-Party User-Visible Components

| Library / Component | Usage |
|---|---|
| shadcn/ui-style components | Buttons, cards, badges, inputs, progress bars, tabs, sheets, avatar UI |
| framer-motion | Page transitions and auth/shell animations |
| lucide-react | Icons used in navigation, dashboard, ranking, goals, dialogs, and actions |
| Tailwind CSS | Responsive layout and visual styling |

---

## User Feedback & Usability Evaluation

We conducted user feedback sessions with target users who have experience with GitHub repositories and collaborative development.

### Main issues identified

Users pointed out that:

- repository connection and switching needed clearer behavior,
- dashboard information could feel crowded or repetitive,
- goal creation needed a clearer full workflow,
- goal states needed clearer labels and status feedback,
- synced teammate and ranking data should be easier to understand,
- some error messages appeared in confusing places,
- too many feedback messages could distract users,
- and technical database details should not dominate the main user flow.

### Improvements made based on feedback

Based on the feedback, we made the following improvements:

- simplified the Dashboard so it focuses on key summary information,
- added modal details for XP sources, teammates, goals, and merged pull requests,
- improved the goal creation and management flow,
- added clearer goal states and goal-status explanations,
- improved repository switching and workspace behavior,
- separated recent repository loading errors from manual repository input,
- moved important success and error feedback into clearer UI messages,
- added confirmation before removing a repository,
- added search and time-range filtering to Team ranking,
- reduced duplicated or obsolete prototype sections,
- simplified the About page,
- and cleaned up unused code and repeated UI blocks.

---

## API and Persistence

The application uses:

- GitHub REST API for repository metadata and contribution activity,
- Firebase Authentication for GitHub sign-in,
- Cloud Firestore for persisted user, workspace, repository, goal, leaderboard, score-rule, contributor, merged pull request, and progress data.

Persisted data is separated by authenticated user and/or selected repository, depending on the type of data:

- **Auth profile and workspace** are stored per signed-in user.
- **Repository score rules, goals, goal metrics, contributors, and merged PR details** are stored per repository.
- **User progress and leaderboard rows** are stored per user and repository, which enables team comparison while keeping each user's saved workspace separate.

The app uses Firestore subscriptions for live updates of shared repository data:

- leaderboard rows update live through `subscribeLeaderboard`,
- team goals update live through `subscribeRequestsForRepo`,
- auth state updates through `subscribeAuthState`.

GitHub API requests are cached for a short period to reduce repeated requests and improve stability when GitHub rate limits are reached. When GitHub data cannot be refreshed, the app falls back to saved Firebase data and shows clear status feedback.

---

## Grade-Oriented Implementation Notes

The latest code is intended to satisfy the Architecture/code A criterion:

- application state is centralized in MobX stores,
- strict MobX action mode is enabled,
- views receive data and callbacks through props,
- presenters connect MobX state and controller workflows to views,
- external services are isolated in `services/`,
- Firebase write side effects are exposed through MobX store persistence actions,
- controllers no longer directly own Firebase write calls such as workspace, progress, goal, score-rule, contributor, or merged-PR persistence,
- and user-visible third-party components are used through shadcn/ui-style components, framer-motion, and lucide-react.

---

## Submission Notes

- Group participants and Canvas IDs are listed above.
- The running web app is linked in the Live Demo section.
- The GitHub repository is linked above.
- Documented user feedback and improvements are summarized in this README.
- The project uses GitHub API data and Firebase Authentication/Firestore persistence.
- The project follows an MVC/MVP-style structure with separated MobX stores, controllers, services, presenters, and views.
- Application-state persistence is routed through MobX store actions to address the state-manager side-effect requirement.
