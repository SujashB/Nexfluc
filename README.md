# Nexfluc

**Your AI Companion to Understand, Position, and Stand Out**

Nexfluc is an AI-powered platform that helps entrepreneurs validate their startup ideas, understand the competitive landscape, and generate unique brand identities. Built for the **MUGxTavilyxLastMile AI Hackathon**, it combines real-time voice transcription, market research, and AI-driven insights to transform startup ideas into actionable strategies.

## 🎯 What It Does

Nexfluc provides a comprehensive suite of tools for startup idea validation and brand development:

### Core Features

- **🎤 Real-Time Voice Transcription**: Speak your startup idea naturally using ElevenLabs Scribe for live transcription
- **🔍 Market Intelligence**: Automatically researches competitors, design trends, color schemes, and logo styles using Tavily's search API
- **💡 AI-Powered Insights**: Generates actionable differentiation strategies based on market research and competitor analysis
- **🌐 Interactive Network Graph**: Visualizes relationships between concepts, features, markets, and similar startups in a 3D network graph
- **🎨 Brand Identity Generation**: Creates unique brand names, taglines, color palettes, and design rationales that differentiate from competitors
- **💾 Data Persistence**: Saves insights and brand data to Supabase PostgreSQL database for future reference

### How It Works

1. **Speak Your Idea**: Users can either type or speak their startup idea using real-time transcription
2. **Market Research**: Tavily API automatically searches for competitors, design patterns, and market trends
3. **AI Analysis**: Groq (Llama 3.3 70B) or OpenAI (GPT-4o-mini) analyzes the idea and generates:
   - Similar startups with similarity scores
   - Market summary and potential
   - Specific differentiation strategies
   - Network graph of related concepts
4. **Brand Generation**: Creates unique brand identities with competitor-aware color palettes and design rationales
5. **Visualization**: Displays insights in an interactive 3D network graph and formatted brand visualization

## 🏗️ How It Was Built

Nexfluc is built as a modern full-stack Next.js application with a focus on real-time interactions and AI-powered insights.

### Architecture

- **Frontend**: React 19 with Next.js 16 App Router
- **Backend**: Next.js API Routes for serverless functions
- **Database**: Supabase PostgreSQL for data persistence
- **Real-Time**: ElevenLabs Scribe for live voice transcription
- **AI Integration**: Multiple AI providers with fallback mechanisms

### Key Components

1. **Insights Pane** (`components/ui/insights-pane.tsx`): 
   - Displays market research, competitor analysis, and differentiation strategies
   - Shows Tavily research data in condensed, bullet-point format
   - Manages real-time transcription state

2. **Future Brand Visualization** (`components/ui/future-brand-visualization.tsx`):
   - Generates and displays brand identity options
   - Shows color palettes with competitor comparisons
   - Provides design rationale explaining color choices

3. **Network Graph** (`components/ui/network-graph-canvas.tsx`):
   - Interactive 3D visualization using Three.js
   - Shows relationships between entities, concepts, and startups
   - Enriched with Tavily research data

4. **API Routes**:
   - `/api/insights`: Generates insights using Groq/OpenAI with Tavily market research
   - `/api/generate-brand`: Creates brand identities with competitor-aware design
   - `/api/enrich-nodes`: Enriches network graph nodes with Tavily search
   - `/api/save-insights` & `/api/save-brand`: Persists data to Supabase

## 🛠️ Technologies Used

### Frontend Framework & UI
- **Next.js 16.0.3** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Motion (Framer Motion) 12.23.24** - Animations
- **Lucide React** - Icon library

### 3D Visualization
- **Three.js 0.181.2** - 3D graphics library
- **@react-three/fiber 9.4.0** - React renderer for Three.js
- **@react-three/drei 10.7.7** - Useful helpers for react-three-fiber
- **@react-three/postprocessing 3.0.4** - Post-processing effects

### AI & Machine Learning
- **Groq SDK 0.36.0** - Fast inference with Llama 3.3 70B Versatile
- **OpenAI API** - GPT-4o-mini as fallback for text generation
- **Tavily 1.0.2** - AI-powered search API for market research
- **@google/genai 1.30.0** - Google Generative AI (for future image generation)

### Voice & Audio
- **@elevenlabs/react 0.11.0** - React hooks for ElevenLabs
- **@elevenlabs/elevenlabs-js 2.25.0** - ElevenLabs JavaScript SDK
- **ElevenLabs Scribe** - Real-time voice transcription

### Data & Analytics
- **Supabase 2.84.0** - PostgreSQL database and backend services
- **pg 8.16.3** - PostgreSQL client for Node.js
- **d3 7.9.0** - Data visualization library
- **ml-kmeans 7.0.0** - Machine learning clustering
- **umap-js 1.4.0** - Dimensionality reduction for network graphs

### State Management & Utilities
- **Zustand 5.0.8** - Lightweight state management
- **Jotai 2.15.1** - Atomic state management
- **SWR 2.3.6** - Data fetching and caching
- **clsx 2.1.1** - Conditional class names
- **tailwind-merge 3.4.0** - Merge Tailwind classes

### Development Tools
- **ESLint 9** - Code linting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- API keys for:
  - ElevenLabs (for voice transcription)
  - Groq or OpenAI (for AI insights)
  - Tavily (for market research)
  - Supabase (for database)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd Nexfluc/nexfluc
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**:

Create a `.env.local` file in the `nexfluc` directory:

```bash
# ElevenLabs (for voice transcription)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
ELEVENLABS_API_KEY=your-api-key-here

# AI Providers (at least one required)
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# Tavily (for market research)
TAVILY_API_KEY=your-tavily-api-key

# Supabase (for database)
SUPABASE_PASSWORD=your-supabase-password
```

4. **Run the development server**:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

1. **Start Transcription**: Click the "Transcribe" button to begin voice input
2. **Speak Your Idea**: Describe your startup idea naturally
3. **View Insights**: Watch as the system generates:
   - Similar startups with similarity scores
   - Market intelligence from Tavily research
   - Differentiation strategies
   - Interactive network graph
4. **Generate Brand**: The system automatically creates brand identity options with competitor-aware color palettes
5. **Explore Visualizations**: Interact with the 3D network graph to explore relationships

## 🎨 Features in Detail

### Market Intelligence
- **Competitor Analysis**: Identifies similar startups and their positioning
- **Design Trends**: Researches current design patterns in your industry
- **Color Schemes**: Analyzes competitor color palettes
- **Logo Styles**: Studies competitor logo designs

### AI-Powered Insights
- Uses Groq's Llama 3.3 70B for fast, high-quality analysis
- Falls back to OpenAI GPT-4o-mini if Groq is unavailable
- Incorporates Tavily research data for context-aware insights

### Brand Generation
- Generates multiple brand name and tagline options
- Creates color palettes that differentiate from competitors
- Provides design rationale explaining color choices
- Saves brand data to Supabase for persistence

## 🗄️ Database Schema

The application uses Supabase PostgreSQL with two main tables:

- **`insights`**: Stores transcription, insights summary, differentiation strategies, startups data, and network graph nodes/edges
- **`brand_identities`**: Stores generated brand names, taglines, color palettes, and design rationales

## 🤝 Contributing

This project was built for the MUGxTavilyxLastMile AI Hackathon. Contributions and improvements are welcome!

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- **Tavily** - For powerful AI-powered search capabilities
- **Groq** - For fast AI inference
- **ElevenLabs** - For real-time voice transcription
- **Supabase** - For database infrastructure
- **Next.js** - For the excellent framework

---

Made with ❤️ for the MUGxTavilyxLastMile AI Hackathon
