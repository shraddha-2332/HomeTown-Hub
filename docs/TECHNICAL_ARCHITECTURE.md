# Technical Architecture

## Overview

Hometown Hub uses a decoupled web architecture:

- React frontend for the user interface
- Express backend for domain APIs
- MongoDB persistence layer with Mongoose-backed storage

## Frontend Layers

- `pages`: route-level screens
- `components`: reusable UI blocks
- `data`: seed content and API adapters
- `styles`: global design system

## Backend Layers

- `routes`: HTTP endpoints
- `controllers`: request orchestration
- `data`: MongoDB connection, schemas, and bootstrap seed source
- `utils`: helpers and response formatting

## Core Domain Entities

- User
- Community
- Membership
- Post
- Comment
- Event
- Notification
- Report

## API Design

REST endpoints grouped under `/api`:

- `/api/auth`
- `/api/communities`
- `/api/posts`
- `/api/events`
- `/api/notifications`
- `/api/admin`

## Security Roadmap

- Password hashing with `bcrypt`
- JWT-based authentication
- Input validation
- Role-based authorization
- Rate limiting

## Deployment Roadmap

- Frontend: Vercel or Netlify
- Backend: Render, Railway, or AWS
- Database: MongoDB Atlas
