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
    
    // Only include verses when explicitly requested or in very specific situations
    const verseKeywords = ['verse', 'scripture', 'bible', 'word of god', 'passage', 'show me', 'give me a verse'];
    const explicitVerseRequest = verseKeywords.some(keyword => input.includes(keyword));
    
    // Generate deeply conversational responses
    if (language === 'english') {
      // Greeting responses
      if (input.includes('hello') || input.includes('hi') || input.includes('good morning') || input.includes('good evening')) {
        return {
          response: "Hello there! It's wonderful to connect with you today. How has your day been going? I'm here to listen and walk alongside you in whatever you're experiencing.",
          includeVerse: false
        };
      }
      
      // Prayer and spiritual questions
      if (input.includes('pray') || input.includes('prayer')) {
        return {
          response: "I'm so glad you want to talk about prayer. It's one of the most beautiful ways we can connect with God. What's prompting you to think about prayer today? Are you looking for guidance on how to pray, or is there something specific weighing on your heart that you'd like to bring to God? I find that sometimes just talking through our thoughts can help us know how to pray about them.",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Emotional support - worry/anxiety
      if (input.includes('worry') || input.includes('anxious') || input.includes('stress') || input.includes('nervous')) {
        return {
          response: "I can hear that you're feeling worried, and I want you to know that you're not alone in this. Anxiety can feel so overwhelming sometimes, can't it? What's been causing you the most stress lately? Sometimes it helps to name our worries out loud - it can make them feel less intimidating. Have you found anything that helps you when you're feeling this way?",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Sadness and depression
      if (input.includes('sad') || input.includes('depressed') || input.includes('down') || input.includes('hurt') || input.includes('pain')) {
        return {
          response: "I'm really sorry you're going through a difficult time right now. Your pain is real and valid, and I want you to know that it's okay to not be okay sometimes. Would you feel comfortable sharing what's been weighing so heavily on your heart? Even if you don't want to go into details, sometimes just having someone acknowledge our pain can be a small comfort. How long have you been feeling this way?",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Gratitude and joy
      if (input.includes('thank') || input.includes('grateful') || input.includes('blessing') || input.includes('happy') || input.includes('joy')) {
        return {
          response: "It's so beautiful to hear gratitude in your voice! There's something really special about taking time to recognize the good things in our lives, isn't there? What has been bringing you joy or gratitude lately? I'd love to celebrate these blessings with you. Sometimes sharing our gratitude with others multiplies the joy we feel.",
          includeVerse: false
        };
      }
      
      // Forgiveness and guilt
      if (input.includes('forgive') || input.includes('guilt') || input.includes('mistake') || input.includes('sin') || input.includes('wrong')) {
        return {
          response: "It takes courage to face our mistakes and seek forgiveness. I can sense this is weighing on you. Would you like to talk about what happened? Sometimes guilt can feel so heavy, but remember that God's heart toward you is always love and forgiveness when we come to Him honestly. Have you been able to forgive yourself, or is that part of what you're struggling with?",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Relationships and love
      if (input.includes('relationship') || input.includes('family') || input.includes('friend') || input.includes('marriage') || input.includes('love')) {
        return {
          response: "Relationships are such a central part of our lives, aren't they? They can bring us our greatest joys and sometimes our deepest challenges too. What's happening in your relationships that you'd like to talk about? Whether you're celebrating something wonderful or working through difficulties, I'm here to listen and support you.",
          includeVerse: false
        };
      }
      
      // Faith and spiritual growth
      if (input.includes('faith') || input.includes('believe') || input.includes('god') || input.includes('jesus') || input.includes('christian')) {
        return {
          response: "I love that you're thinking about your faith journey. Our relationship with God is so personal and unique to each of us. What's been on your heart spiritually lately? Are you experiencing growth, questions, struggles, or maybe a mix of all three? There's no judgment here - wherever you are in your faith is exactly where God meets you.",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Work and purpose
      if (input.includes('work') || input.includes('job') || input.includes('purpose') || input.includes('calling')) {
        return {
          response: "Work and finding our purpose can be such significant parts of our lives. How are things going for you in that area? Whether you're feeling fulfilled, frustrated, or somewhere in between, I'd love to hear what's on your mind. Sometimes talking through our work situations can help us see God's hand in our daily lives.",
          includeVerse: false
        };
      }
      
      // Default conversational response - much more engaging
      return {
        response: "Thank you for sharing with me. I'm really glad you're here and that we can talk together. What you've said is important, and I want to make sure I understand what you're going through. Can you tell me a bit more about what's been on your mind lately? I'm here to listen, support you, and walk with you through whatever you're experiencing.",
        includeVerse: false
      };
    } else {
      // Enhanced Amharic responses
      if (input.includes('ሰላም') || input.includes('እንደምን') || input.includes('ጤና')) {
        return {
          response: "ሰላም ለእርስዎ! ዛሬ ከእርስዎ ጋር መገናኘቴ በጣም ደስ ይለኛል። ቀንዎ እንዴት እያለፈ ነው? በሚያጋጥመዎት ማንኛውም ሁኔታ ላይ ለመስማት እና ከእርስዎ ጎን ለመሆን እዚህ ነኝ።",
          includeVerse: false
        };
      }
      
      if (input.includes('ጸሎት') || input.includes('እጸልያለሁ')) {
        return {
          response: "ስለ ጸሎት መነጋገር እንደሚፈልጉ በጣም ደስ ይለኛል። ከእግዚአብሔር ጋር ለመገናኘት ካሉት ወደዳጆች መንገዶች አንዱ ነው። ዛሬ ስለ ጸሎት እንዲያስቡ ያደረገዎት ምንድን ነው? እንዴት እንደሚጸልዩ መመሪያ ይፈልጋሉ፣ ወይስ ወደ እግዚአብሔር ልታመጡት የምትፈልጉ የተለየ ነገር አለ? አንዳንድ ጊዜ ሀሳባችንን መነጋገር እንዴት እንደምንጸልይላቸው እንድናውቅ ይረዳናል።",
          includeVerse: explicitVerseRequest
        };
      }
      
      if (input.includes('ጭንቀት') || input.includes('ሰጋ') || input.includes('ውጥረት')) {
        return {
          response: "ጭንቀት እንዳለዎት እሰማለሁ፣ እና በዚህ ውስጥ ብቻዎ እንዳልሆኑ እንዲያውቁ እፈልጋለሁ። ጭንቀት አንዳንድ ጊዜ በጣም የሚያሸንፍ ሊሆን ይችላል፣ አይደል? በቅርቡ ስጋት የሚፈጥርልዎት ምንድን ነው? አንዳንድ ጊዜ ጭንቀታችንን በድምፅ መጥራት - ያን ያህል አስፈሪ እንዳይሆኑ ሊያደርግ ይችላል። ይህን ስሜት ሲሰማዎት የሚረዳዎት ነገር አግኝተው ያውቃሉ?",
          includeVerse: explicitVerseRequest
        };
      }
      
      // Default Amharic response - more engaging
      return {
        response: "ይህን ከእኔ ጋር ስላካፈሉ አመሰግናለሁ። እዚህ መሆንዎ እና አብረን መነጋገር መችላችን በጣም ደስ ይለኛል። ያለዎት ነገር ጠቃሚ ነው፣ እና እያጋጠመዎት ያለውን መረዳቴን ማረጋገጥ እፈልጋለሁ። በቅርቡ አእምሮዎን ላይ ያለውን የበለጠ ልንገሩኝ ይችላሉ? ለመስማት፣ ለመደገፍ እና በሚያጋጥመዎት ማንኛውም ነገር ከእርስዎ ጋር ለመሄድ እዚህ ነኝ።",
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