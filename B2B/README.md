# RehabNet B2B Admin Platform

## Project Overview

**What is this project?**
The RehabNet B2B Admin Platform is a full-stack web application designed for managing rehabilitation networks. It consists of a React-based frontend and an Express.js backend, fully containerized with Docker for easy deployment.

**What problem does it solve?**
It provides a centralized interface for administrators to manage:
- Doctors and their patient assignments.
- Patient rehabilitation profiles.
- System-wide B2B configurations.

**Key Features:**
- **Admin Dashboard**: Comprehensive view of system metrics.
- **Doctor/Patient Management**: CRUD operations for medical profiles.
- **Dockerized Environment**: One-command setup for both frontend and backend.
- **Modern Tech Stack**: Vite, React, Node.js, Express, MongoDB.

---

## Installation Requirements

### Prerequisites
- **Operating System**: Windows, macOS, or Linux.
- **Software**:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop) (Required for containerization).
  - [Git](https://git-scm.com/) (For cloning the repository).
  - Node.js (Optional, if running locally without Docker).

### Environment Setup
1. Ensure Docker is running.
2. Verify ports **5000** (Backend) and **5173** (Frontend) are free.

---

## Getting Started

### Quick Start (Docker)
The easiest way to run the project is using Docker Compose.

1. **Clone the repository** (if you haven't already).
2. **Configure Environment Variables**:
   Ensure `backend/.env` exists with necessary keys (e.g., `MONGO_URI`, `JWT_SECRET`).
3. **Run the Application**:
   Open a terminal in the project root (`d:\B2B`) and run:
   ```bash
   docker-compose up --build
   ```
4. **Verify Installation**:
   - **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your browser.
   - **Backend**: Visit [http://localhost:5000](http://localhost:5000) (should show "Admin backend running..." or similar).

---

## Core Functionality

### Main Modules
- **Backend (`/backend`)**:
  - **Server**: `src/server.js` - Entry point.
  - **API Routes**: Handles data requests for doctors/patients.
  - **Database**: Connects to MongoDB.
- **RehabNet (`/rehabnet`)**:
  - **Frontend**: React application built with Vite.
  - **Docker Config**: Uses `node:22` base image for compatibility.

### Key Configuration Options
- **Docker Compose**: Defined in `docker-compose.yml`. Orchestrates the two services.
  - `backend`: Maps port 5000.
  - `frontend`: Maps port 5173.

---

## Usage Examples

### Running in Development Mode
To start the full stack:
```bash
docker-compose up
```

### Stopping the Services
Press `Ctrl+C` in the terminal or run:
```bash
docker-compose down
```

---

## Project Structure

```
B2B/
├── docker-compose.yml    # Main orchestration file
├── README.md             # Project documentation
├── backend/              # Backend Node.js Application
│   ├── Dockerfile        # Backend container config
│   ├── .env              # Backend secrets
│   ├── src/              # Source code
│   └── package.json      # Dependencies (Express, Mongoose)
└── rehabnet/             # Frontend React Application
    ├── Dockerfile        # Frontend container config
    ├── vite.config.js    # Vite bundling config
    ├── src/              # React components
    └── package.json      # Dependencies (React, Vite)
```

---

## Troubleshooting

**Common Issues:**

1. **"Vite requires Node.js version 20.19+..."**
   - **Solution**: Ensure your `rehabnet/Dockerfile` uses `FROM node:22`. (This has been configured in the current setup).

2. **"Port already in use"**
   - **Solution**: Stop other processes resolving to port 5000 or 5173.
   - command: `netstat -ano | findstr :5000` (Windows) to find the PID, then `taskkill /PID <PID> /F`.

3. **Backend Database Connection Failures**
   - **Solution**: Check your `backend/.env` file. Ensure `MONGO_URI` is correct. If using Docker, ensure network connectivity.

---

## Contributing

1. **Fork** the repository.
2. **Create a branch** for your feature: `git checkout -b feature/amazing-feature`.
3. **Commit** your changes.
4. **Push** to the branch.
5. **Open a Pull Request**.

---

## License

This project is proprietary.
*(Check `package.json` for specific dependency licenses like ISC).*
