# RateMyBite — Progress Report (Checkpoint 2)

This document summarizes the progress made on RateMyBite between **Checkpoint 1** and **Checkpoint 2**.

---

## 🟦 Overview

From Checkpoint 1 to Checkpoint 2, the team progressed from **early planning** to a **functioning backend system**.  
Key accomplishments include:

- Establishing the backend architecture  
- Connecting MongoDB with Mongoose  
- Implementing core REST API endpoints  
- Designing data models  
- Adding authentication (JWT)  
- Conducting initial testing  
- Updating all project documentation  

---

## 🟩 Design Refinements

### Architecture Enhancements

- Expanded high-level system design, data flow, and component responsibilities (see DESIGN.md).
- Finalized the tech stack:
  - **Frontend:** React or Next.js  
  - **Backend:** Node.js + Express 5  
  - **Database:** MongoDB with Mongoose  
  - **Auth:** JWT (JSON Web Tokens)

### Feature Definitions

- Added **Admin Dashboard** feature with role-based access:
  - Restaurant CRUD  
  - Review moderation  
  - Category management  
- Included additional details on:
  - Schema design
  - Security considerations
  - Deployment expectations

---

## 🟧 Implementation Progress

### Repository & Project Setup

- Created `backend/` directory with:
  - `server.js`
  - `routes/`
  - `controllers/`
  - `models/`
  - `config/db.js`
- Installed dependencies:
  - `express`, `mongoose`, `dotenv`, `cors`, `bcrypt`, `jsonwebtoken`, `nodemon`

### MongoDB Integration

- Connected Express to MongoDB using:
