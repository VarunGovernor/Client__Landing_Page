# Ham Tech Innovatives — Client Landing Page

A premium, client-focused landing page for **Ham Tech Innovatives**, built with Angular 17+ and an interactive Three.js 3D background canvas showcasing the company's core products and services.

---

## 🚀 Features

- **Interactive 3D Canvas** — Floating 3D objects (smartphone, browser window, server rack, AI core sphere) built with Three.js, all textured with high-resolution UI images
- **Project Showcase** — Featured projects section with animated modal cards (My Voters Hub, CRM Dashboard, One Rider, AI Automation Integration)
- **Contact Form** — Direct-to-email contact form using FormSubmit AJAX (no backend required)
- **Angular 17 SSR** — Server-side rendering for fast initial load and SEO
- **Professional Design** — Enterprise-focused palette using Indigo, Blue, and Slate tones
- **Fully Responsive** — Mobile-first layout with collapsible navigation
- **Smooth Animations** — Scroll-linked parallax, hover effects, and micro-animations

---

## 📋 Prerequisites

- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **Angular CLI** v17+

---

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VarunGovernor/Client__Landing_Page.git
   cd Client__Landing_Page
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:4200`

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
Client__Landing_Page/
├── public/
│   └── models/                  # 3D texture assets
│       ├── phone_ui.png         # Smartphone screen UI texture
│       ├── browser_ui.png       # Browser window UI texture
│       ├── server_front.png     # Server rack UI texture
│       └── ai_core.png          # AI core sphere texture
├── src/
│   ├── app/
│   │   ├── app.ts               # Main Angular component (Three.js + Logic)
│   │   ├── app.html             # Main template
│   │   ├── app.css              # Component styles
│   │   ├── app.config.ts        # Angular app configuration
│   │   └── app.routes.ts        # Application routes
│   ├── index.html               # HTML entry point
│   ├── main.ts                  # Browser bootstrap
│   ├── main.server.ts           # SSR bootstrap
│   ├── server.ts                # Express SSR server
│   └── styles.css               # Global styles
├── angular.json                 # Angular workspace configuration
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

---

## 🧩 Featured Projects

| Project | Description | Status |
|---|---|---|
| **My Voters Hub** | Voter management mobile app | ✅ Live |
| **CRM Dashboard** | Staffing CRM web platform | ✅ Live |
| **One Rider** | Multi-service delivery app | 🔜 Coming Soon |
| **AI Automation Integration** | Workflow automation tools | 📩 Contact Us |

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Angular 17 (SSR) |
| 3D Rendering | Three.js |
| Styling | TailwindCSS |
| Form Handling | Angular Reactive Forms + FormSubmit |
| Build Tool | Angular CLI / Esbuild |
| Deployment | Static / Node.js SSR |

---

## 📬 Contact

For business inquiries and project collaborations:

📧 **[hamtechinnovatives@gmail.com](mailto:hamtechinnovatives@gmail.com)**

---

© 2026 Ham Tech Innovatives. All rights reserved.
