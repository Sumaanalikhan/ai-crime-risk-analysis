# CrimeGuard 🛡️

*Real-time crime risk awareness and intelligent safe navigation powered by AI. Designed for Karachi, Pakistan.*

## 📖 About The Project
CrimeGuard is a full-stack web application built to predict neighborhood safety scores dynamically based on historical patterns and time of day. It provides users with live heatmap visualizers and calculates travel routes that actively steer clear of high-incident areas to ensure safe transit.

## 💻 Tech Stack
**Frontend:**
* React.js (Vite)
* Tailwind CSS
* React Router DOM
* Leaflet (OpenStreetMap Tiles)
* Axios

**Backend & Database:**
* Node.js & Express.js
* MongoDB Atlas
* Mongoose
* JWT (JSON Web Tokens) & bcryptjs for Authentication

## 🚀 Current Status (Active Development)
The project is currently in active development. 

- [x] Figma to React UI conversion (100% Responsive)
- [x] Express Server Initialization
- [x] MongoDB Atlas Connection
- [x] User Authentication (Register/Login API & JWT)
- [ ] React Protected Routes
- [ ] AI Risk Prediction Algorithm
- [ ] Dynamic Routing Logic

## 🛠️ Local Setup
To run this project locally:

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/Sumaanalikhan/crime-risk-analyser.git
   \`\`\`

2. **Start the Backend**
   \`\`\`bash
   cd backend
   npm install
   npm run dev
   \`\`\`
   *Requires a `.env` file with `MONGO_URI` and `JWT_SECRET`.*

3. **Start the Frontend**
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`