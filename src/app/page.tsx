import SpaceScene from "@/components/SpaceScene";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-4 sm:p-24 overflow-hidden bg-transparent">
      <SpaceScene />

      {/* Content overlays the scene */}
      <div className="relative z-10 w-full max-w-4xl flex-1 flex flex-col items-center justify-center pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          NASA Space Explorer
        </h1>
        <div className="pointer-events-auto w-full flex justify-center">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
