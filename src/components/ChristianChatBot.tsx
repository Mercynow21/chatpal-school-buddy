import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Globe, BookOpen, Heart, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  verse?: {
    reference: string;
    text: string;
    devotion: string;
  };
}

interface BibleVerse {
  id: string;
  verse_reference: string;
  english_text: string;
  amharic_text: string;
  english_devotion: string;
  amharic_devotion: string;
  theme: string;
}

const ChristianChatBot = () => {
  const { profile, updateProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'english' | 'amharic'>(profile?.preferred_language || 'english');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: language === 'english' 
      ? "Welcome! I'm your Christian devotion companion. I can share Bible verses, devotions, and spiritual guidance in English and Amharic. How can I encourage you today?"
      : "እንኳን ደህና መጡ! እኔ የእርስዎ የክርስትና ወንድምማሪ አጋር ነኝ። በእንግሊዝኛና በአማርኛ የመጽሐፍ ቅዱስ ጥቅሶች፣ ወንድምማሪና መንፈሳዊ መምሪያ ልካፍልዎ እችላለሁ። ዛሬ እንዴት ልበረታዎት እችላለሁ?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [language]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleLanguageToggle = async () => {
    const newLanguage = language === 'english' ? 'amharic' : 'english';
    setLanguage(newLanguage);
    
    if (profile) {
      await updateProfile({ preferred_language: newLanguage });
    }
  };

  const getRandomVerse = async (): Promise<BibleVerse | null> => {
    try {
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .limit(50);

      if (error || !data || data.length === 0) {
        console.error('Error fetching verses:', error);
        return null;
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const generateConversationalResponse = (userInput: string, previousMessages: Message[]): { response: string; includeVerse: boolean } => {
    const input = userInput.toLowerCase();
    
    // Check recent bot messages to avoid repetition
    const recentBotMessages = previousMessages.slice(-4).filter(m => !m.isUser).map(m => m.content);
    
    // Only include verses when explicitly requested
    const verseKeywords = ['verse', 'scripture', 'bible', 'word of god', 'passage', 'show me', 'give me a verse'];
    const explicitVerseRequest = verseKeywords.some(keyword => input.includes(keyword));
    
    // Generate varied conversational responses
    if (language === 'english') {
      // Greeting responses
      if (input.includes('hello') || input.includes('hi') || input.includes('good morning') || input.includes('good evening')) {
        const greetings = [
          "Hello! It's great to connect with you today. What's on your heart?",
          "Hi there! How has your day been treating you?",
          "Good to see you! What brings you here today?",
          "Hello! I'm glad you stopped by. How can I walk alongside you today?"
        ];
        return {
          response: greetings[Math.floor(Math.random() * greetings.length)],
          includeVerse: false
        };
      }
      
      // Identity/purpose questions
      if (input.includes('identity') || input.includes('who am i') || input.includes('purpose') || input.includes('calling')) {
        const identityResponses = [
          "Questions about identity and purpose are so important. You are deeply loved by God, created with intention and purpose. What's making you think about your identity today?",
          "Identity in Christ is such a beautiful thing to explore. You are chosen, beloved, and have unique gifts to offer the world. What aspects of your identity are you wrestling with?",
          "Your identity is rooted in being God's beloved child. That's your foundation, no matter what else is happening. What's prompting these thoughts about who you are?"
        ];
        return {
          response: identityResponses[Math.floor(Math.random() * identityResponses.length)],
          includeVerse: explicitVerseRequest
        };
      }
      
      // Prayer responses
      if (input.includes('pray') || input.includes('prayer')) {
        const prayerResponses = [
          "Prayer is such a gift. What would you like to pray about together?",
          "I'd be honored to pray with you. What's weighing on your heart?",
          "Let's talk to God together. What's on your mind?",
          "Prayer changes things, including us. How can we pray today?"
        ];
        return {
          response: prayerResponses[Math.floor(Math.random() * prayerResponses.length)],
          includeVerse: explicitVerseRequest
        };
      }
      
      // Worry/anxiety responses
      if (input.includes('worry') || input.includes('anxious') || input.includes('stress') || input.includes('nervous')) {
        const worryResponses = [
          "Anxiety can feel so overwhelming. What's been causing you the most stress?",
          "I hear the worry in your words. You don't have to carry this alone. What's troubling you?",
          "Stress can be so heavy. What specific situation is weighing on you right now?",
          "Those anxious thoughts can be exhausting. What's been keeping you up at night?"
        ];
        return {
          response: worryResponses[Math.floor(Math.random() * worryResponses.length)],
          includeVerse: explicitVerseRequest
        };
      }
      
      // Sadness responses
      if (input.includes('sad') || input.includes('depressed') || input.includes('down') || input.includes('hurt')) {
        const sadnessResponses = [
          "I'm sorry you're hurting. Your pain matters, and so do you. What's been difficult lately?",
          "It sounds like you're going through a tough season. I'm here to listen. What's been hardest?",
          "Those heavy feelings are real. You don't have to pretend to be okay. What's going on?",
          "I can hear the sadness in what you're sharing. What's been breaking your heart lately?"
        ];
        return {
          response: sadnessResponses[Math.floor(Math.random() * sadnessResponses.length)],
          includeVerse: explicitVerseRequest
        };
      }
      
      // Follow-up responses based on conversation flow
      if (recentBotMessages.length > 0) {
        const followUpResponses = [
          "Tell me more about that.",
          "How has that been affecting you?",
          "What's that experience been like for you?",
          "I'm listening. Go on.",
          "That sounds significant. How are you processing that?",
          "What's been the hardest part about this?",
          "How long have you been dealing with this?",
          "What support do you have around this situation?"
        ];
        
        // Avoid recently used responses
        const availableResponses = followUpResponses.filter(response => 
          !recentBotMessages.some(msg => msg.includes(response))
        );
        
        if (availableResponses.length > 0) {
          return {
            response: availableResponses[Math.floor(Math.random() * availableResponses.length)],
            includeVerse: false
          };
        }
      }
      
      // Default varied responses
      const defaultResponses = [
        "I'm here with you. What else is on your mind?",
        "Thank you for trusting me with this. What would be helpful right now?",
        "I appreciate you sharing that. How are you feeling about it all?",
        "That's a lot to carry. What's been most challenging?",
        "I'm glad you're here. What do you need most today?",
        "Your thoughts and feelings matter. What else would you like to explore?"
      ];
      
      return {
        response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
        includeVerse: false
      };
    } else {
      // Amharic varied responses
      const amharicResponses = [
        "እዚህ ከእርስዎ ጋር ነኝ። ሌላ ምን አለ በአእምሮዎ ላይ?",
        "ይህን ስላካፈሉኝ አመሰግናለሁ። አሁን ምን ይረዳዎታል?",
        "ያን ስላካፈሉኝ አድርጋለሁ። ስለ ሁሉም እንዴት ይሰማዎታል?",
        "ለመሸከም ብዙ ነው። በጣም አስቸጋሪው ምን ነበር?",
        "እዚህ መሆንዎ ደስ ይለኛል። ዛሬ በጣም የሚያስፈልግዎት ምንድን ነው?"
      ];
      
      return {
        response: amharicResponses[Math.floor(Math.random() * amharicResponses.length)],
        includeVerse: false
      };
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      // Generate contextual response
      const { response, includeVerse } = generateConversationalResponse(currentInput, messages);
      
      let verseData = undefined;
      let finalResponse = response;

      // Only include a verse if the context suggests it would be helpful
      if (includeVerse) {
        const verse = await getRandomVerse();
        if (verse) {
          const text = language === 'english' ? verse.english_text : verse.amharic_text;
          const devotion = language === 'english' ? verse.english_devotion : verse.amharic_devotion;
          
          verseData = {
            reference: verse.verse_reference,
            text,
            devotion
          };

          // Add verse context to response
          if (language === 'english') {
            finalResponse += `\n\nThis verse came to mind: "${text}" - ${verse.verse_reference}`;
          } else {
            finalResponse += `\n\nይህ ጥቅስ አሰብኩ: "${text}" - ${verse.verse_reference}`;
          }
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalResponse,
        isUser: false,
        timestamp: new Date(),
        verse: verseData,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: language === 'english' 
          ? "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
          : "ይቅርታ፣ አሁን ለመገናኘት ችግር አለብኝ። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-button">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">
              {language === 'english' ? 'Christian Devotion Companion' : 'የክርስቶስ ወንድምማሪ አጋር'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'english' ? 'Bible verses & spiritual guidance' : 'የመጽሐፍ ቅዱስ ጥቅሶች እና መንፈሳዊ መምሪያ'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLanguageToggle}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          {language === 'english' ? 'አማርኛ' : 'English'}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.isUser
                    ? 'bg-chat-user text-chat-user-foreground'
                    : 'bg-chat-bot text-chat-bot-foreground border shadow-chat'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                
                {message.verse && (
                  <Card className="mt-3 border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {message.verse.reference}
                        </Badge>
                      </div>
                      <blockquote className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">
                        "{message.verse.text}"
                      </blockquote>
                    </CardContent>
                  </Card>
                )}
                
                <div className="text-xs text-muted-foreground mt-2 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-chat-bot text-chat-bot-foreground border rounded-lg p-4 shadow-chat">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {language === 'english' ? 'Thinking...' : 'እያሰብኩ ነው...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-card/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              language === 'english' 
                ? "Share what's on your heart, ask for prayer, or request a Bible verse..."
                : "በልብዎ ያለውን ያካፍሉ፣ ጸሎት ይጠይቁ፣ ወይም የመጽሐፍ ቅዱስ ጥቅስ ይጠይቁ..."
            }
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChristianChatBot;