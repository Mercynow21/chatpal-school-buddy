import ChatPal from '@/components/ChatPal';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-chat flex flex-col">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-button">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">ChatPal</h1>
              <p className="text-sm text-muted-foreground">Your Friendly Learning Buddy</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <ChatPal />
      </main>
    </div>
  );
};

export default Index;