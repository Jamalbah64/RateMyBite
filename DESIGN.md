# RateMyBite — High-Level Design Document

## 1. Project Motivation

Finding good places to eat can be difficult, especially when users must rely on long lists or outdated reviews. RateMyBite solves this by offering an **interactive map-based food discovery platform** powered by community reviews. The system aims to make restaurant discovery easier, faster, and more visually intuitive.

This project will benefit:
- **Students** seeking affordable or nearby dining spots
- **Travelers** exploring new areas
- **Families** wanting reliable reviews before visiting restaurants
- **Busy workers** needing quick, reliable recommendations
- **Food lovers** who enjoy reviewing and finding new places

---

## 2. Team Responsibilities

Each team member will take responsibility for major components during the initial phase:

| Project Component | Assigned Team Member(s) |
|------------------|-------------------------|
| Frontend UI (React/Next.js) | Reeham, Fatima |
| Backend API (Node.js/Express) | Rikuto |
| Database setup & modeling (MongoDB) | Rikuto |
| Map integration (Google Maps/Mapbox) | Rikuto |
| User authentication & authorization | Reeham |
| Review & rating functionality | Reeham |
| Admin dashboard | Jamal, Fatima |
| Documentation & testing | All members |

---

## 3. External Data Sources & Services

RateMyBite will utilize the following:

### **Mapping APIs**
- **Google Maps JavaScript API** or **Mapbox GL JS**
  - Display maps, pins, routes  
  - User geolocation detection  

### **Geocoding**
- Convert restaurant addresses → latitude/longitude  
- Reverse geocode user’s coordinates → address  

### **Authentication**
- JWT (JSON Web Tokens) **or** Firebase Authentication  

### **Optional External APIs**
- Yelp Fusion API  
- Google Places API  
(These may assist in populating initial restaurant data.)  

### **Media Storage (Optional)**
- Cloudinary for storing review photos

---

## 4. System Architecture (High-Level)

### **Frontend**
- React or Next.js  
- Tailwind CSS for styling  
- Axios for API requests  

### **Backend**
- Node.js + Express REST API  
- JWT authentication  
- Role-based access control (User / Admin)  

### **Database**
- MongoDB (Atlas)  
- Collections:
  - `users`
  - `restaurants`
  - `reviews`
  - `photos`

### **Interactions**
- Frontend ↔ Backend (REST API)  
- Backend ↔ Database (MongoDB queries)  
- Backend ↔ External APIs (Maps, geocoding)  

---

## 5. Core Features Breakdown

### **User Features**
- View restaurants on a map  
- Search by cuisine, distance, rating  
- View restaurant info and photos  
- Create an account  
- Leave ratings and reviews  
- Mark favorites  

### **Admin Features**
- Add/edit/delete restaurants  
- Moderate reviews  
- Manage cuisine categories  

---

## 6. Potential Future Enhancements
- AI recommendations tailored to user preferences  
- Trending food heatmap layer  
- Social feed showcasing new reviews  
- Gamification badges for top reviewers  
- Restaurant route-planning  

