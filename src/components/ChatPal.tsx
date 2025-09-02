import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, BookOpen, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatPal = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatPalResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple pattern matching for demo - in real app would use AI API
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hi there! 👋 I'm ChatPal, your friendly learning buddy! What would you like to explore today?";
    }
    
    if (lowerMessage.includes('what') && lowerMessage.includes('you')) {
      return "I'm ChatPal! I help explain things in simple ways. I love answering questions about science, math, reading, and lots more! What are you curious about? 🤔";
    }
    
    if (lowerMessage.includes('math')) {
      return "Math is like solving puzzles! 🧩 It helps us:\n• Count and measure things\n• Share fairly (like splitting cookies!)\n• Build cool stuff\n\nWhat math topic interests you most?";
    }
    
    if (lowerMessage.includes('science')) {
      return "Science is amazing! 🔬 It's how we learn about:\n• Animals and plants\n• How things work\n• Space and stars\n• Cool experiments\n\nWhat would you like to discover?";
    }
    
    if (lowerMessage.includes('read')) {
      return "Reading opens up whole new worlds! 📚 Books can take you on adventures, teach you new things, and spark your imagination. What kind of stories do you like best?";
    }
    
    // Default friendly response
    return "That's a great question! 🌟 I'm not sure about that one, but let's figure it out together. Can you tell me a bit more about what you're wondering?";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate ChatPal thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getChatPalResponse(input),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startConversation = (topic: string) => {
    setInput(topic);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Welcome Section */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center shadow-button">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Hi! I'm ChatPal! 🌟
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              I'm your friendly learning buddy! I explain things in simple ways and love answering your curious questions. What would you like to explore today?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
            <Button
              variant="outline"
              onClick={() => startConversation("Tell me about math!")}
              className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-gentle transition-all"
            >
              <span className="text-2xl">🧮</span>
              <span className="font-medium">Math Fun</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => startConversation("What's cool about science?")}
              className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-gentle transition-all"
            >
              <span className="text-2xl">🔬</span>
              <span className="font-medium">Science Wonders</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => startConversation("I love reading stories!")}
              className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-gentle transition-all"
            >
              <span className="text-2xl">📚</span>
              <span className="font-medium">Reading Adventures</span>
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <Card className={`max-w-sm md:max-w-md p-4 shadow-chat ${
                message.isBot 
                  ? 'bg-chat-bot text-chat-bot-foreground' 
                  : 'bg-chat-user text-chat-user-foreground'
              }`}>
                {message.isBot && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-hero rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-sm">ChatPal</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </Card>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <Card className="max-w-sm p-4 bg-chat-bot shadow-chat">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-hero rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium text-sm">ChatPal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything! I love curious questions! 🤔"
            className="flex-1 text-base p-4 rounded-2xl border-2"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="px-6 rounded-2xl shadow-button hover:shadow-gentle transition-all"
            size="lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPal;