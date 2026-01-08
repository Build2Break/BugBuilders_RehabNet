
 ### AI-Based Rehabilitation Monitoring System

##  Problem Statement

Traditional pose evaluation systems often fail in rehabilitation contexts because they:
*   **Evaluate frame-by-frame**, penalizing momentary instability.
*   **Expect perfect stillness**, which is impossible for patients with motor impairments.
*   **Lack longitudinal context**, failing to track recovery trends over time.

This system addresses these gaps by evaluating **pose consistency over time**, allowing for natural postural sway and muscle fatigue while providing human-centric, corrective feedback.

##  System Overview

This is a **real-time AI rehabilitation posture evaluation system** built using **Python**, **OpenCV**, and **MediaPipe Pose**. 

Instead of simple classification, it treats "yoga postures" as **structured motion templates** for rehabilitation exercises. It compares live patient movement against a biomechanical baseline (reference pose) to assess joint stability, range of motion, and endurance.

### Key Technologies
*   **MediaPipe Pose**: High-fidelity, real-time body landmark tracking (33 keypoints).
*   **OpenCV**: Video processing and visual overlay rendering.
*   **Vector Geometry**: Calculation of 8 key biomechanical joint angles.

##  Mind Map

```mermaid
mindmap
  root((Rehab System))
    Inputs
      Reference Image (Baseline)
      Live Webcam (Patient Feed)
    Processing
      MediaPipe Pose (Landmarks)
      Vector Geometry (Angle Calc)
    Logic
      Time-Based (60s Session)
      Consistency Check
      Thresholding (+/- 15 deg)
    Output
      Visual Overlay (Skeleton)
      Text Feedback (Corrective)
      Live Score (0-100%)
      Session Report (Summary)
```

##  Flow Diagram

```text
START
  │
  ▼
[ Load Reference Pose ] ─── (Biomechanical Baseline)
  │
  ▼
[ Initialize Webcam ]
  │
  ▼
┌ < Loop: 60-Second Session > ──────────────────────────────┐
│                                                           │
│  1. Capture Frame                                         │
│  2. Extract 33 Landmarks (MediaPipe)                      │
│  3. Compute 8 Joint Angles (Vector Geometry)              │
│  4. Compare vs. Reference (Tolerance: ±15°)               │
│  5. Visual Feedback (Green/Red Skeleton Overlay)          │
│  6. Text Feedback (e.g., "Straighten Right Elbow")        │
│  7. Store Frame Data (Angles & Score)                     │
│                                                           │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
                  [ Session Complete ]
                            │
                            ▼
              [ Compute Average Consistency ]
              (Mean Score over 60s Duration)
                            │
                            ▼
              [ Generate Rehabilitation Report ]
              (Progress, Stability, Motivation)
                            │
                            ▼
                           END
```




##  Core Features

### 1. Biomechanical Angle Analysis
The system computes **8 key joint angles** using vector geometry:
1.  **Shoulder–Elbow–Wrist** (Left & Right)
2.  **Elbow–Shoulder–Hip** (Left & Right)
3.  **Shoulder–Hip–Knee** (Left & Right)
4.  **Hip–Knee–Ankle** (Left & Right)

### 2. Real-Time Visual Feedback
*   **Visual Overlays**: Incorrect joints are highlighted in red; correct ones in green.
*   **Text Guidance**: Specific instructions like "Extend right arm" or "Bend left knee".
*   **Live Score**: A dynamic percentage score reflecting current posture accuracy.

### 3. Session-Based Architecture
*   The system operates in **60-second evaluation sessions**.
*   It does not judge a single frame but averages performance over the entire minute.
*   This accounts for **postural sway** and **endurance**, which are critical rehab metrics.

##  Time-Based Evaluation Logic

**Why Time-Based?**
In rehabilitation, holding a pose is harder than hitting it once. Patients often tremble or sway.

*   **Duration**: 60 seconds per exercise.
*   **Scoring**: The final score is an average of all frame scores, smoothing out outliers caused by momentary loss of balance.
*   **Interpretation**:
    *   **≥ 60%**: Good performance (Stable)
    *   **40–60%**: Partial correctness (Improving)
    *   **< 40%**: Needs improvement (Focus on basics)

##  Rehabilitation Relevance

This system is designed with **"Progress over Perfection"** in mind.

*   **Tolerance**: It allows for a +/- 15 degree deviation from the ideal pose to accommodate limited range of motion.
*   **Motivation**: Feedback is constructive ("Try to extend..." rather than "Wrong").
*   **Holistic View**: By tracking the *entire* session, it identifies fatigue points (e.g., score dropping in the last 10 seconds).


## Outputs
<img width="1733" height="737" alt="image" src="https://github.com/user-attachments/assets/f4f1fe71-0b50-4dd2-ada5-dd72effebcd6" />
<img width="1739" height="729" alt="image" src="https://github.com/user-attachments/assets/1d88158b-1dab-425f-b08d-816c81f93931" />



##  Demo Instructions

To run the rehabilitation monitoring prototype:

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run the Real-Time Evaluation**:
    ```bash
    python demo_opencv.py
    ```
    *   Ensure your webcam is connected.
    *   Stand back to let the camera see your full body.
    *   Follow the on-screen instructions to match the reference pose.

3.  **CLI Tools (Optional)**:
    For batch processing or advanced analysis:
    ```bash
    python -m src.main --help
    ```

##  Future Extensions

*   **Longitudinal Database**: Store patient session data to plot recovery curves over weeks.
*   **ROM Quantification**: Automatically measure and log max Range of Motion (ROM) for specific joints.
*   **Telerehab Dashboard**: A web interface for therapists to review patient sessions remotely.
*   **Voice Coaching**: Integrate TTS to speak corrections aloud for visually impaired patients.



##  Summary

The **AI-Based Rehabilitation Monitoring System** bridges the gap between rigid computer vision metrics and the fluid reality of physical therapy. By focusing on **consistency**, **time-based evaluation**, and **forgiving thresholds**, it provides a tool that is not just accurate, but **clinically relevant** and **encouraging** for patients on their road to recovery.

## 📁 Project Structure Overview

### 1. **B2B/** - Main Rehabilitation Platform
The core B2B application for managing rehabilitation services with doctor and patient dashboards.

**Components:**
- **backend/** - Express.js REST API server
- **rehabnet/** - React frontend application using Vite

**Key Features:**
- Patient rehabilitation profile management
- Exercise assignment and tracking
- Progress logging and monitoring
- OTP-based authentication
- Real-time patient data updates

---

### 2. **B2B_Admin/** - Admin Management Dashboard
Administrative interface for managing the entire system.

**Components:**
- **RehabNet/** - React admin frontend using Vite
- **RNBackend/** - Express.js backend for admin operations

**Key Features:**
- Doctor management (CRUD operations)
- Patient assignment to doctors
- System metrics and dashboards
- Admin user authentication
- Doctor-patient relationship management

---

### 3. **final/** - AI-Powered Exercise Validation (Python)
Pose detection and exercise form validation using machine learning.

**Components:**
- **app/** - FastAPI application for pose analysis
- **assets/Video/** - Training data and reference videos

**Key Features:**
- Real-time pose detection using MediaPipe
- Exercise form validation
- Pose comparison algorithms
- Session-based exercise scoring

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend (B2B) | Node.js, Express.js, MongoDB |
| Frontend (B2B) | React 19, Vite, React Router |
| Admin Backend | Node.js, Express.js, MongoDB |
| Admin Frontend | React 19, Vite, React Router |
| Exercise AI | Python, FastAPI, MediaPipe, OpenCV |
| Containerization | Docker, Docker Compose |
| Security | JWT, bcryptjs, Helmet, Rate Limiting, NoSQL Sanitization |

---

## 📋 Prerequisites

### For All Services
- **Docker** & **Docker Compose** (Recommended for easy setup)
- **Git**

### For Local Development (without Docker)
- **Node.js** (v16 or higher) - for B2B and B2B_Admin
- **Python** (v3.8 or higher) - for exercise validation
- **MongoDB** (local or cloud instance)

### Required Ports
- **5000** - B2B Backend
- **5173** - B2B Frontend (rehabnet)
- **5001** - B2B_Admin Backend (RNBackend)
- **5174** - B2B_Admin Frontend (RehabNet)
- **8000** - Final App (Python/FastAPI)

---

## 🚀 Quick Start Guide

### Option 1: Using Docker (Recommended)

#### B2B Platform
```bash
cd d:\end1\B2B
docker-compose up --build
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

#### B2B Admin Platform
```bash
cd d:\end1\B2B_Admin
docker-compose up --build
```
- Backend: http://localhost:5001
- Frontend: http://localhost:5174

#### Python Exercise Validation App
```bash
cd d:\end1\final\app
pip install -r requirements.txt
python main.py
```
- API: http://localhost:8000

---

### Option 2: Local Development Setup

#### B2B Backend Setup
```bash
cd d:\end1\B2B\backend

# Install dependencies
npm install

# Create .env file with:
# MONGO_URI=mongodb://your-mongo-uri
# JWT_SECRET=your-jwt-secret
# NODE_ENV=development
# PORT=5000

# Run development server
npm run dev
```

#### B2B Frontend Setup
```bash
cd d:\end1\B2B\rehabnet

# Install dependencies
npm install

# Run development server
npm run dev
```

#### B2B_Admin Backend Setup
```bash
cd d:\end1\B2B_Admin\RNBackend

# Install dependencies
npm install

# Create .env file with required variables
npm run dev
```

#### B2B_Admin Frontend Setup
```bash
cd d:\end1\B2B_Admin\RehabNet

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Python App Setup
```bash
cd d:\end1\final\app

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn opencv-python mediapipe numpy scipy

# Run the app
python main.py
```

---

## 📂 Folder Organization

### B2B Backend Structure
```
backend/
├── config/          # Database and environment configuration
├── controllers/     # Business logic for each feature
│   ├── authController.js        # Authentication logic
│   ├── patientController.js     # Patient management
│   ├── exerciseController.js    # Exercise management
│   ├── otpController.js         # OTP handling
│   └── progressController.js    # Progress tracking
├── middleware/      # Express middleware
│   ├── authMiddleware.js        # JWT verification
│   ├── errorHandler.js          # Error handling
│   └── noSqlSanitizer.js        # NoSQL injection prevention
├── models/          # MongoDB schemas
│   ├── Patient.js
│   ├── Doctor.js
│   ├── Exercise.js
│   ├── ProgressLog.js
│   ├── RehabProfile.js
│   └── Otp.js
├── routes/          # API endpoints
│   ├── authRoutes.js
│   ├── patientRoutes.js
│   ├── exerciseRoutes.js
│   ├── otpRoutes.js
│   └── progressRoutes.js
├── utils/           # Utility functions
│   ├── emailService.js          # Email notifications
│   ├── seeder.js                # Database seeding
│   └── debug-db.js              # Database debugging
└── server.js        # Main server entry point
```

### B2B Frontend Structure
```
rehabnet/
├── src/
│   ├── components/              # Reusable React components
│   │   ├── ExerciseManager.jsx  # Exercise management UI
│   │   ├── ExerciseTimer.jsx    # Timer for exercises
│   │   └── ProtectedRoute.jsx   # Route protection
│   ├── pages/                   # Page components
│   │   ├── Login.jsx            # Doctor login
│   │   ├── PatientLogin.jsx     # Patient login
│   │   ├── Dashboard.jsx        # Doctor dashboard
│   │   ├── PatientDashboard.jsx # Patient dashboard
│   │   ├── ExercisePage.jsx     # Exercise details
│   │   └── Home.jsx             # Home page
│   ├── utils/
│   │   └── api.js               # API client setup
│   └── App.jsx                  # Main app component
└── vite.config.js               # Vite configuration
```

### B2B_Admin Backend Structure
```
RNBackend/
├── src/
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server entry point
│   ├── config/                  # Configuration files
│   ├── controllers/             # Business logic
│   ├── middleware/              # Custom middleware
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   └── utils/                   # Utility functions
```

### B2B_Admin Frontend Structure
```
RehabNet/
├── src/
│   ├── components/              # Reusable components
│   │   ├── AdminNavbar.jsx
│   │   ├── Input.jsx
│   │   └── ProtRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication state
│   ├── pages/                   # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DoctorList.jsx
│   │   ├── DoctorAdd.jsx
│   │   ├── DoctorUpdate.jsx
│   │   ├── DoctorDelete.jsx
│   │   └── DoctorPatients.jsx
│   ├── api/
│   │   └── auth_api.js          # Authentication API
│   ├── services/
│   │   └── token.service.js     # Token management
│   └── App.jsx
```

### Python App Structure
```
final/app/
├── main.py                      # FastAPI application
│   ├── Session management
│   ├── Pose detection
│   ├── Exercise validation
│   └── Scoring algorithms
└── assets/Video/                # Reference video data
    └── yoga_data/               # Training videos
```

---

## 🔄 API Endpoints Overview

### B2B Backend (`/api/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login (doctor/patient) |
| `/auth/signup` | POST | User registration |
| `/patients` | GET/POST | Patient management |
| `/patients/:id` | GET/PUT/DELETE | Individual patient operations |
| `/exercises` | GET/POST | Exercise management |
| `/progress` | GET/POST | Progress logging |
| `/otp/send` | POST | Send OTP for verification |

### B2B_Admin Backend (`/api/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Admin login |
| `/doctors` | GET/POST | Doctor management |
| `/doctors/:id` | GET/PUT/DELETE | Individual doctor operations |
| `/doctors/:id/patients` | GET | Doctor's assigned patients |

### Python FastAPI (`/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/video_feed` | GET | Real-time video stream |
| `/validate_exercise` | POST | Validate exercise form |
| `/session/start` | POST | Start exercise session |
| `/session/end` | POST | End exercise session |

---

## 🔐 Environment Variables

### B2B Backend (`.env`)
```
MONGO_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

### B2B_Admin Backend (`.env`)
```
MONGO_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-secret-key
PORT=5001
NODE_ENV=development
```

---

## 🏃 Running the Complete System

### All Services at Once (Using Docker)
```bash
# Terminal 1: B2B Platform
cd d:\end1\B2B
docker-compose up --build

# Terminal 2: B2B Admin
cd d:\end1\B2B_Admin
docker-compose up --build

# Terminal 3: Python App
cd d:\end1\final\app
pip install -r requirements.txt
python main.py
```

---

## 📝 Development Workflow

### Frontend Development
1. Navigate to the respective `rehabnet/` or `RehabNet/` folder
2. Run `npm run dev` to start Vite dev server
3. Vite will hot-reload changes automatically

### Backend Development
1. Navigate to `backend/` or `RNBackend/` folder
2. Run `npm run dev` to start nodemon
3. Changes will auto-restart the server

### Python App Development
1. Navigate to `final/app/`
2. Run `python main.py`
3. Modifications require manual restart

---

## 🧪 Building for Production

### Frontend Build
```bash
cd rehabnet  # or RehabNet for admin
npm run build
npm run preview
```

### Backend Docker Build
```bash
docker build -t rehabnet-backend .
docker run -p 5000:5000 rehabnet-backend
```

### Python App Distribution
```bash
# Create virtual environment for production
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access if using cloud MongoDB

### Docker Issues
```bash
# Clean up containers and images
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Node Modules Issues
```bash
# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## 👥 Project Team

RehabNet - Comprehensive Rehabilitation Management System

---

## 📄 License

ISC

---

## ✅ Checklist for First-Time Setup

- [ ] Clone/download the repository
- [ ] Install Docker or Node.js/Python locally
- [ ] Navigate to each project directory
- [ ] Create `.env` files with required variables
- [ ] Run `npm install` for Node.js projects
- [ ] Run `pip install -r requirements.txt` for Python projects
- [ ] Verify all ports are available (5000, 5173, 5001, 5174, 8000)
- [ ] Start services (Docker or local)
- [ ] Access frontends in browser
- [ ] Test API endpoints

---

**Last Updated:** January 2026





