# 🎓 Studyboard — Next-Gen AI Collaborative Whiteboard

> **An intelligent, real-time collaborative workspace for study groups, powered by Google Gemini multimodal vision, interactive 3D STEM models, and an all-subject AI tutor.**

---

## 🌟 Inspiration

Studying complex subjects remotely is hard. While modern video tools allow groups to chat, standard digital whiteboards are passive and disconnected from the learning process—they can't read your handwritten formulas, calculate graphs, or explain tricky concepts. 

We built **Studyboard** to turn the classic whiteboard into an **active learning companion**. Whether you are working through calculus equations, sketching organic chemistry reactions, or analyzing literature and economics questions, Studyboard recognizes what you write and gives you live, contextual tools and AI tutoring right on the canvas.

---

## ✨ Key Features

### 🤖 1. All-Subject AI Tutor (Powered by Gemini)
- **Lasso & Solve**: Use the Lasso tool to select any handwritten or drawn note, equation, or diagram on the board.
- **Multimodal Handwriting OCR**: Accurately transcribes messy handwriting and mathematical symbols across disciplines—mathematics, physics, chemistry, biology, history, engineering, and general coursework.
- **Step-by-Step Breakdown**: Generates clear, pedagogical step-by-step explanations and highlights the core concept.
- **Pin to Canvas**: Instantly pin the AI solution as a sticky note next to your work with a single click.

### 🧪 2. Interactive 3D Molecular Viewer
- Sketch a chemical formula or stick molecule and select **"View 3D Molecule"**.
- Studyboard parses the chemical structure and renders an interactive, rotatable 3D ball-and-stick model directly on the board.

### 📈 3. Math Parabola & Equation Plotter
- Select any quadratic or algebraic expression.
- Automatically calculates the vertex, roots/intercepts, and factored form, rendering an interactive coordinate graph.

### 🎨 4. Infinite Collaborative Whiteboard
- **Complete Creative Suite**: Freehand pens with dynamic brush sizing, smart translucent highlighters, geometric shapes (rectangles, diamonds, ellipses, triangles), connectors, and canvas text tools.
- **Color-Adaptive Sticky Notes**: Add notes with automatic high-contrast typography and color swatches.
- **Smooth Navigation**: Infinite canvas with fluid panning, trackpad zoom gestures, keyboard shortcuts, and mini-map zoom controls.

### 📄 5. Universal Document & Note Sync
- Drag-and-drop or import PDFs and slide images onto the canvas.
- Integrated high-speed file storage endpoints ensure uploaded slides and problem sheets instantly sync and render across all collaborators' screens.

### 👥 6. Real-Time Study Rooms
- Create dedicated study rooms or join via instant invite codes.
- Live participant counters and session persistence so work is never lost.

---

## 🛠️ Tech Stack

- **Frontend & Framework**: [Next.js 15+ (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), [SweetAlert2](https://sweetalert2.github.io/)
- **AI & Multimodal Intelligence**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/) using `gemini-2.5-flash` for high-speed multimodal vision OCR and tutoring
- **3D & Canvas Graphics**: HTML5 Canvas API, SVG renderers, and interactive 3D WebGL viewers
- **Persistence & Sync**: Real-time room management with optimistic local caching and server-side document storage

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/studyboard.git
   cd studyboard