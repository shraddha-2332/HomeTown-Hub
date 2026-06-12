# Hometown Hub

Hometown Hub is a digital community platform for people who want to stay connected with their hometown, village, or local city community. This repository contains a Phase 1 full-stack foundation with:

- `frontend`: React application for the community experience
- `backend`: Express API for auth, communities, posts, events, notifications, and admin workflows
- `docs`: product and technical planning artifacts

## Phase 1 Scope

- User onboarding and login
- Community discovery and join requests
- Community feed with posts, announcements, likes, and comments
- Event creation and participation
- Notifications
- Moderator and platform admin foundations

## Repository Structure

|-- backend
|   |-- src
|-- docs
|-- frontend
|   |-- src
|-- package.json


## Getting Started

1. Install dependencies:

npm.cmd install

2. Start MongoDB locally or point the backend at a hosted MongoDB instance.

3. Copy the backend environment template and set values:
Copy-Item backend\\.env.example backend\\.env


4. Run the frontend and backend in development mode:

npm.cmd run dev


## Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: MongoDB with Mongoose-backed persistence
- Styling: CSS with design tokens, responsive layout, and component-focused styles

## Notes

The backend now seeds MongoDB from [backend/src/data/db.json](/c:/HomeTown-Hub/backend/src/data/db.json:1) on first boot when the database is empty. That JSON file is now a seed source, not the runtime database.