# dh2642-github-hero-quest

## Short description
This project is a web application that connects to a GitHub repository and helps users view repository activity in a more engaging and user-friendly way. The app includes a dashboard, leaderboard, notifications, and quest configuration features.

## What we have done
We have already set up the basic framework and implemented the main structure of the app.

So far, we have completed:
- the initial layout and navigation
- GitHub sign-in
- repository connection
- dashboard rendering
- syncing GitHub data
- Firebase authentication and persistence
- leaderboard display
- basic quest editing
- loading, notification, and error feedback

## What we still plan to do
We are currently polishing the remaining parts of the project.

We still plan to:
- improve repository validation and switching
- improve manual sync and retry feedback
- make notifications less disruptive to the main page
- refine the request creation flow
- improve leaderboard date labels and ranking details
- complete shared quest persistence
- continue improving the UX based on user feedback

## Project file structure
- `src/models/` – application state and business logic
- `src/presenters/` – connects the model to the views
- `src/views/` – UI components and pages
- `src/services/` – GitHub API and Firebase logic
- `src/App.jsx` – main app structure
- `src/index.jsx` – app entry point
- `public/` – static files

## Current status
The prototype is already functional and deployed in our Git repository. The core flow works, but some visible features are still being refined from partial implementations into more complete interactions.

## User feedback
We have started collecting user feedback. The first feedback session pointed out issues related to layout stability, repository switching, sync clarity, notifications, and configurability. We will use this feedback to improve the next version of the app.