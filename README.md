# NASA Space Explorer 🚀

A highly interactive, 3D space-themed chatbot powered by Next.js, React Three Fiber, and the Google Gemini API. This project provides a unique conversational interface where users can learn about the cosmos from an AI adopting the persona of a NASA ex-scientist.

## 🌌 Key Features

- **Immersive 3D Background**: Built using `@react-three/fiber` and `@react-three/drei`. Features a starry backdrop with floating, softly rotating asteroids that creates a relaxing, deep-space ambiance.
- **NASA Expert Persona**: Powered by `gemini-2.5-flash`, the AI is prompted to act as a highly knowledgeable, slightly nostalgic NASA ex-scientist, providing accurate and engaging astrophysics and astronomy facts.
- **Glassmorphism UI**: The chat interface utilizes modern Tailwind CSS techniques, featuring a semi-transparent, frosted glass look that overlays beautifully on the 3D canvas.
- **Real-Time Streaming Responses**: Just like ChatGPT, the module streams the Gemini AI's responses token-by-token directly to the UI, providing a fast and dynamic user experience.
- **Rich Markdown Formatting**: AI responses are parsed and styled using `react-markdown` and `@tailwindcss/typography`, ensuring that bullet points, bold text, and structured information are crystal clear.
- **Voice Input**: Integrated with the standard Web Speech API, users can click the microphone icon to speak their questions directly to the AI, which are automatically transcribed into the chat input.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router / React 19)
- **Styling**: Tailwind CSS v4 + Tailwind Typography
- **3D Rendering**: Three.js, React Three Fiber, React Three Drei
- **AI Integration**: `@google/genai` (Gemini API)
- **Icons**: Lucide React
- **Markdown**: React Markdown, Remark GFM
- **Language**: TypeScript

## 🚀 Getting Started

1. **Clone the repository** (if applicable)
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your Gemini API key:

   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Explore**:
   Open [http://localhost:3000](http://localhost:3000) with your browser to start your journey through the cosmos.
