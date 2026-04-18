# Project Requirements - AgentMaria PM Dashboard

This document outlines the necessary environment and dependencies to run and develop the AgentMaria Project Management Dashboard.

## 🛠 Software Requirements

| Requirement | Version | Link |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0+ | [Download](https://nodejs.org/) |
| **npm** | v9.0.0+ | (Included with Node.js) |
| **Git** | latest | [Download](https://git-scm.com/) |
| **Browser** | Modern (ES6 support) | Chrome, Firefox, Safari, Edge |

## 📦 Core Dependencies

- **UI Framework**: React 19 (TypeScript)
- **Styling Engine**: Tailwind CSS v4.0+
- **Workflow Canvas**: @xyflow/react (React Flow)
- **State Management**: Zustand (with Persistence)
- **Icon Suite**: Lucide-React

## 💻 Development Environment

- **IDE**: Visual Studio Code (Recommended)
- **Extensions**: 
    - ESLint
    - Tailwind CSS IntelliSense
    - PostCSS Language Support

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/parallaxiz/agentmaria.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```

## ⚙️ Build & Deployment

- **Build Command**: `npm run build`
- **Output Directory**: `/dist`
- **Deployment**: Can be hosted on Vercel, Netlify, or Github Pages (SPA configuration required).
