# 🛡️ Crime Risk Analyser — Predictive Safety & Safe-Route Navigation Engine

> **A full-stack geospatial risk intelligence platform that evaluates location-based crime exposure in real time and recommends safer alternative travel routes.**

---

## 🎯 Problem & Solution

**The Problem:** Standard navigation apps optimize strictly for distance and traffic speed—often routing commuters through high-risk zones during vulnerable hours without any safety context.

**The Solution:** **Crime Risk Analyser** bridges geospatial routing with historical incident analytics. By scoring route segments against temporal and location-based risk factors, it empowers users to assess area safety before traveling and dynamically choose lower-risk paths.

---

## ✨ Key Engineering Highlights

* **Predictive Crime Risk Scoring (`PredictRisk`):** Calculates dynamic risk levels by factoring in geographic coordinates, time-of-day windows, and historical incident density.
* **Safety-Weighted Route Engine (`SafeRoutes`):** Compares candidate travel corridors and ranks alternative routes based on cumulative risk exposure rather than distance alone.
* **Modular Full-Stack Architecture:** Clean separation of concerns between a responsive React SPA client and a RESTful Node.js/Express API backed by MongoDB Atlas.
* **Environment & Secret Hygiene:** Decoupled configuration management using environment templates (`.env.example`) to keep production credentials isolated from source control.

---

## 🏗️ System Architecture

```text
┌─────────────────────────┐        REST API (JSON)        ┌─────────────────────────┐
│     React Frontend      │ ◄───────────────────────────► │   Node.js / Express     │
│  • SafeRoutes.jsx       │                               │  • Risk Scoring Engine  │
│  • PredictRisk.jsx      │                               │  • Route Evaluator      │
└─────────────────────────┘                               └────────────┬────────────┘
                                                                       │ Mongoose ODM
                                                                       ▼
                                                          ┌─────────────────────────┐
                                                          │     MongoDB Atlas       │
                                                          │  • Incident Datasets    │
                                                          │  • Geospatial Queries   │
                                                          └─────────────────────────┘

```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React, JavaScript (ES6+), HTML5, CSS3 |
| **Backend** | Node.js, Express.js, RESTful APIs |
| **Database** | MongoDB, MongoDB Atlas, Mongoose |
| **DevOps & Tooling** | Git, GitHub, npm, Environment Config Management |

---

## 📂 Repository Structure

```text
Crime-Risk-analyser/
├── client/                     # React frontend application
│   └── src/
│       ├── pages/
│       │   ├── SafeRoutes.jsx  # Safe route comparison & visualization UI
│       │   └── PredictRisk.jsx # Location & time-based risk assessment UI
│       └── App.jsx
├── server/                     # Node.js & Express REST API
├── .env.example                # Environment variable template
├── .gitignore                  # Excluded build, dependency & secret files
└── README.md

```

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Sumaanalikhan/Crime-Risk-analyser.git
cd Crime-Risk-analyser

```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install

```

### 3. Configure Environment Variables

Copy the example environment file and add your MongoDB URI:

```bash
cp .env.example .env

```

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

```

### 4. Run the Application

```bash
# Start backend server (from root)
npm start

# Start frontend dev server (from /client)
npm run dev

```

---

## 🔮 Roadmap

* [ ] Containerize frontend and backend services with **Docker** and **Docker Compose**
* [ ] Configure automated CI/CD checks via **GitHub Actions**
* [ ] Add interactive heatmap overlays for neighborhood-level risk visualization

---

## 👤 Author

**Suman Ali Khan**

* GitHub: [@Sumaanalikhan](https://github.com/Sumaanalikhan)

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](https://www.google.com/search?q=LICENSE) for more information.