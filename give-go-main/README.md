# Give & Go

create a website with these features # Donation & Reuse Platform for Clothes and Household Items

Build a modern, professional, responsive full-stack web application called **"ShareAt – Donation & Reuse Platform"**. The application should have a premium UI/UX, be mobile-friendly, and use a clean design with smooth animations.

## Tech Stack

* Frontend: React.js + Vite
* Styling: Tailwind CSS
* Backend: Node.js + Express.js
* Database: MongoDB
* Authentication: JWT
* File Upload: Cloudinary (or local storage for development)
* Icons: Lucide React
* Charts: Recharts
* Routing: React Router
* Form Validation: React Hook Form

---

# User Roles

The system has **three separate dashboards**.

## 1. User Dashboard

When a normal user logs in, only the **User Dashboard** should open.

### Features

* Register
* Login
* Forgot Password
* Profile Management
* Edit Profile
* Upload Profile Picture
* Donate Clothes
* Donate Household Items
* Upload Multiple Images
* Select Item Category
* Mention Quantity
* Mention Condition
* Pickup Address
* Pickup Date & Time
* Live Donation Status
* Donation History
* Notification Center
* View Nearby NGOs
* Search NGOs
* View Pickup History
* Download Donation Receipt (PDF)
* Dark Mode
* Logout

Dashboard Cards

* Total Donations
* Pending Donations
* Completed Donations
* Scheduled Pickups

---

## 2. Volunteer Dashboard

When a volunteer logs in, only the **Volunteer Dashboard** should open.

### Features

* Volunteer Profile
* Assigned Pickups
* Accept Pickup
* Reject Pickup
* View Pickup Location
* Pickup Route Map
* Mark Item Collected
* Upload Collection Photo
* Update Delivery Status
* Delivery History
* Notifications
* Availability Toggle (Online/Offline)
* Performance Statistics
* Logout

Dashboard Cards

* Today's Pickups
* Completed Pickups
* Pending Pickups
* Assigned Requests

---

## 3. Admin Dashboard

When the admin logs in, only the **Admin Dashboard** should open.

### Fixed Admin Credentials

Admin Email

[admin@shareat.com](mailto:admin@shareat.com)

Admin Password

Admin@123

These credentials must be hardcoded initially and should always redirect to the Admin Dashboard.

### Admin Features

Dashboard Analytics

* Total Users
* Total Volunteers
* Total Donations
* Pending Donations
* Completed Donations
* Total Pickups
* NGOs Registered
* Monthly Donation Graph
* Recent Activities

User Management

* View Users
* Edit Users
* Delete Users
* Suspend Users
* Activate Users

Volunteer Management

* View Volunteers
* Approve Volunteers
* Reject Volunteers
* Assign Pickups
* Remove Volunteer

Donation Management

* View All Donations
* Approve Donation
* Reject Donation
* Assign Volunteer
* Update Donation Status
* View Donation Details

Category Management

* Clothes
* Footwear
* Books
* Furniture
* Kitchen Items
* Electronics
* Toys
* Others

Reports

* Daily Report
* Weekly Report
* Monthly Report
* Export PDF
* Export Excel

Notifications

* Send Notification to All Users
* Send Notification to Volunteers
* Individual Notification

Settings

* Change Logo
* Manage Categories
* Manage Cities
* Website Settings

Logout

---

# Landing Page

Create a beautiful homepage with

* Hero Section
* About
* Features
* How It Works
* Impact Counter
* Testimonials
* FAQs
* Contact
* Footer

Navigation Bar

* Home
* About
* Features
* NGOs
* Contact
* Login
* Register

---

# Authentication

Role Selection

User

Volunteer

Admin

Each role should be redirected to its own dashboard after successful login.

---

# Donation Workflow

User

↓

Uploads Donation

↓

Admin Reviews

↓

Admin Approves

↓

Volunteer Assigned

↓

Volunteer Collects Items

↓

Donation Delivered

↓

Completed

---

# Database Collections

Users

Volunteers

Admins

Donations

Items

Pickup Requests

Notifications

Reports

Categories

---

# UI Requirements

* Premium modern UI
* Responsive on Desktop, Tablet, and Mobile
* Glassmorphism cards
* Gradient buttons
* Smooth animations
* Loading skeletons
* Toast notifications
* Search and filters
* Pagination
* Charts and analytics
* Professional icons
* Empty-state illustrations

---

# Extra Features

* QR code for every donation
* Email notification on status changes
* Search by city
* Filter by category
* Download receipt as PDF
* Real-time dashboard updates
* Image preview before upload
* Multi-image upload
* Form validation
* Secure JWT authentication
* Protected routes
* Role-based authorization

---

# Folder Structure

Frontend

Backend

Components

Pages

Layouts

Hooks

Services

API

Routes

Models

Controllers

Middleware

Assets

Utils

---

# Deliverables

Generate a production-ready project with clean code, reusable components, proper folder structure, comments, REST APIs, responsive UI, role-based authentication, and separate dashboards for User, Volunteer, and Admin. The application should be fully functional and easy to extend with future features.

login must work and when the user login time redirect user dashboard with user features when voluntree login that time open voluntree dashboard with voluntree features, when admin login that time open admin dashboard with admin features

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bdd08a31-d0bd-4d54-9073-20f8af6db1dd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
