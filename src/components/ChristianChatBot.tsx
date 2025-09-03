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
    setInputValue('');
    setLoading(true);

    try {
      // Get a random Bible verse for the response
      const verse = await getRandomVerse();
      
      let botResponse = '';
      let verseData = undefined;

      if (verse) {
        const text = language === 'english' ? verse.english_text : verse.amharic_text;
        const devotion = language === 'english' ? verse.english_devotion : verse.amharic_devotion;
        
        verseData = {
          reference: verse.verse_reference,
          text,
          devotion
        };

        if (language === 'english') {
          botResponse = `Here's a verse that came to mind for you:\n\n"${text}" - ${verse.verse_reference}\n\n${devotion}\n\nMay this verse bring you peace and encouragement today. Is there anything specific you'd like to pray about or discuss?`;
        } else {
          botResponse = `ለእርስዎ በአሳብ የመጣኝ ጥቅስ እነሆ፤\n\n"${text}" - ${verse.verse_reference}\n\n${devotion}\n\nይህ ጥቅስ ዛሬ ሰላምና ድፍረት ያመጣልዎ ዘንድ እመኛለሁ። በተለይ ልትጸልዩለት ወይም ልንወያይባቸው የምትፈልጉ ነገሮች አሉ?`;
        }
      } else {
        botResponse = language === 'english'
          ? "I'm here to support you with biblical encouragement and prayer. How can I help you grow in your faith today?"
          : "በመጽሐፍ ቅዱሳዊ ውበት እና በጸሎት ልደግፍዎ ዝግጁ ነኝ። ዛሬ በእምነትዎ እንዴት እንድታደጉ ልረዳዎት እችላለሁ?";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
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