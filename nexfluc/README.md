# Nexfluc

A glassmorphic voice agent interface built with Next.js and ElevenLabs.

## Features

- 🎨 Beautiful glassmorphic UI design
- 🎤 Real-time voice conversation with ElevenLabs Agents
- 🌊 Animated orb visualization that responds to audio input/output
- 📝 Live transcription display
- 💡 Smart suggestions for conversation actions

## Getting Started

### Prerequisites

- Node.js 18+ 
- An ElevenLabs account with an Agent ID

### Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Configure your ElevenLabs Agent ID:

Create a `.env.local` file in the `nexfluc` directory:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
```

You can find your Agent ID in the [ElevenLabs UI](https://elevenlabs.io/app/agents).

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Using the Voice Agent

1. Click "Start Conversation" to begin
2. Grant microphone permissions when prompted
3. The orb will animate based on conversation state:
   - **Idle**: Static orb
   - **Listening**: Blue pulsing animation
   - **Speaking**: Purple pulsing animation
4. Your transcriptions will appear in real-time
5. Use suggestion buttons to send text messages to the agent
6. Click "End Conversation" to stop

### For Authenticated Agents

If your agent requires authentication, you'll need to:

1. Set up a backend endpoint to generate signed URLs (for WebSocket) or conversation tokens (for WebRTC)
2. Update the `startConversation` function in `app/page.tsx` to use your backend endpoint instead of directly using the agent ID

See the [ElevenLabs React documentation](https://elevenlabs.io/docs/api-reference/react) for more details.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
