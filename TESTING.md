# RateMyBite — Testing Plan

This document explains how the team will verify that all components of RateMyBite function correctly.

---

## 1. Testing Strategy

The team will use the following methods:

### **Unit Testing**
- Test backend controllers, utilities, and API endpoints independently  
- Validate business logic such as:
  - Review creation
  - User login
  - Restaurant filtering

### **Integration Testing**
- Ensure backend, database, and external APIs work together  
- Example: Create review → store in DB → display on frontend  

### **Functional/UI Testing**
- Map loads and displays markers  
- Filters correctly update search results  
- Review forms validate errors properly  
- Mobile responsiveness checks  

### **Acceptance Testing**
- Full user flow tested manually:
  - Register → Login → Browse → Review → Logout  

### **Cross-Browser Testing**
- Chrome, Firefox, Edge, Safari  

---

## 2. Components to Test

### **Frontend**
- Map rendering and marker clustering  
- Restaurant detail pages load properly  
- Login and registration forms  
- Review submission with images  
- Search and filtering  
- Navigation and page routing  

### **Backend**
- `/auth/register`  
- `/auth/login`  
- `/restaurants` GET/POST  
- `/restaurants/:id` GET  
- `/reviews` POST/DELETE  
- Authorization middleware (JWT)  

### **Database**
- Restaurants stored with correct geo-coordinates  
- Reviews linked to correct users/restaurants  
- Unique email index for users  
- Proper indexing for geo-queries  

---

## 3. Sample Test Cases

### **Test Case 1: User Login**
- **Input:** valid email + password  
- **Expected:** JWT returned, redirect to homepage  

### **Test Case 2: Map Marker Display**
- **Input:** Load map  
- **Expected:** Restaurant pins appear within correct radius  

### **Test Case 3: Review Submission**
- **Input:** rating=4, text="Great food!"  
- **Expected:** Review saved and instantly visible  

### **Test Case 4: Filtering**
- **Input:** filter by rating ≥ 4  
- **Expected:** only restaurants with rating ≥ 4 display  

### **Test Case 5: Unauthorized Access**
- **Input:** POST `/restaurants` without admin token  
- **Expected:** 403 Forbidden  

---

## 4. Tools
- **Postman** — test backend routes  
- **Jest** (optional) — backend unit tests  
- **React Testing Library** (optional)  
- **Manual UI testing**  
- **GitHub Issues** for bug tracking  

---

## 5. Completion Criteria
The project is considered fully functional when:
- Users can browse restaurants on the map  
- Authentication works securely  
- Users can post reviews and ratings  
- Admin can manage restaurants  
- Map loads accurately with all markers  
- All major workflows run without errors  
