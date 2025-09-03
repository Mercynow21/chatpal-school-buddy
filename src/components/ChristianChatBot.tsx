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

  const generateConversationalResponse = (userInput: string): { response: string; includeVerse: boolean } => {
    const input = userInput.toLowerCase();
    
    // Keywords that suggest the user wants a Bible verse
    const verseKeywords = ['verse', 'scripture', 'bible', 'word of god', 'passage'];
    const includeVerse = verseKeywords.some(keyword => input.includes(keyword));
    
    // Generate contextual responses based on user input
    if (language === 'english') {
      if (input.includes('pray') || input.includes('prayer')) {
        return {
          response: "Prayer is such a powerful way to connect with God! I'd be honored to pray with you. What's on your heart that you'd like to bring to the Lord? Remember, He hears every word and knows your needs even before you speak them.",
          includeVerse: true
        };
      }
      
      if (input.includes('worry') || input.includes('anxious') || input.includes('stress')) {
        return {
          response: "I understand that you're feeling worried right now. It's completely natural to feel anxious sometimes, but remember that God wants to carry these burdens for you. Have you tried bringing these concerns to Him in prayer? Sometimes just talking to God about our worries can bring such peace.",
          includeVerse: true
        };
      }
      
      if (input.includes('sad') || input.includes('depressed') || input.includes('down')) {
        return {
          response: "I can hear that you're going through a difficult time, and I want you to know that your feelings are valid. God sees your pain and He's with you in this season. Even when we can't feel His presence, He promises never to leave us. Would you like to talk more about what's weighing on your heart?",
          includeVerse: true
        };
      }
      
      if (input.includes('thank') || input.includes('grateful') || input.includes('blessing')) {
        return {
          response: "What a beautiful heart of gratitude you have! It's so wonderful to hear you recognizing God's blessings in your life. Gratitude really does transform our perspective, doesn't it? I'd love to celebrate these blessings with you - what has God been doing in your life lately?",
          includeVerse: false
        };
      }
      
      if (input.includes('forgive') || input.includes('guilt') || input.includes('mistake')) {
        return {
          response: "Forgiveness is at the very heart of the Gospel, and I'm so glad you're seeking it. God's love for you is unchanging, and His forgiveness is complete when we come to Him with repentant hearts. Have you been able to bring this situation to God in prayer? Sometimes talking through our guilt can help us receive His grace.",
          includeVerse: true
        };
      }
      
      if (input.includes('love') || input.includes('relationship') || input.includes('family')) {
        return {
          response: "Relationships are such a gift from God, aren't they? Whether you're celebrating love or working through challenges, God wants to be part of your relationships. He designed us for connection and community. What's happening in your relationships that you'd like to talk about or pray over?",
          includeVerse: false
        };
      }
      
      // Default conversational response
      return {
        response: "Thank you for sharing that with me. I'm here to walk alongside you in your faith journey. Sometimes it helps just to have someone listen and pray with us. What's been on your heart lately? I'd love to hear more about what God is doing in your life or how I can support you in prayer.",
        includeVerse: Math.random() > 0.7 // 30% chance of including a verse
      };
    } else {
      // Amharic responses
      if (input.includes('ጸሎት') || input.includes('እጸልያለሁ')) {
        return {
          response: "ጸሎት ከእግዚአብሔር ጋር ለመገናኘት በጣም ኃይለኛ መንገድ ነው! ከእርስዎ ጋር ልጸልይ ክብር ይሆንልኛል። ወደ እግዚአብሔር ልታመጡት የምትፈልጉት ምንድን ነው? እሱ እያንዳንዱን ቃል እንደሚሰማ እና ከመናገርዎ በፊት ፍላጎትዎን እንደሚያውቁ ያስታውሱ።",
          includeVerse: true
        };
      }
      
      if (input.includes('ጭንቀት') || input.includes('ሰጋ')) {
        return {
          response: "አሁን ያለዎትን ጭንቀት ተረድቻለሁ። አንዳንድ ጊዜ ጭንቀት መሰማት ፈጽሞ ተፈጥሯዊ ነው፣ ነገር ግን እግዚአብሔር እነዚህን ሸክሞች ለእርስዎ መሸከም እንደሚፈልግ ያስታውሱ። እነዚህን ጉዳዮች በጸሎት ወደ እሱ ማምጣት ሞክረው ያውቃሉ? አንዳንድ ጊዜ ጭንቀታችንን ለእግዚአብሔር መናገር ብቻ ታላቅ ሰላም ማምጣት ይችላል።",
          includeVerse: true
        };
      }
      
      // Default Amharic response
      return {
        response: "ይህን ከእኔ ጋር ስላካፈሉ አመሰግናለሁ። በእምነት ጉዞዎ ላይ ከእርስዎ ጎን ለመሆን እዚህ ነኝ። አንዳንድ ጊዜ አንድ ሰው እንዲሰማን እና እንዲጸልይልን ብቻ መኖር ይረዳል። በቅርቡ ልብዎን ላይ ያለው ምንድን ነው? እግዚአብሔር በህይወትዎ ያለውን ወይም በጸሎት እንዴት ልደግፍዎ እንደምችል የበለጠ ለመስማት እወዳለሁ።",
        includeVerse: Math.random() > 0.7
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
      const { response, includeVerse } = generateConversationalResponse(currentInput);
      
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