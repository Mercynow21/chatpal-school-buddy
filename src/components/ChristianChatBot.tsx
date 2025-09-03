import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Globe, BookOpen, Heart, Loader2, Star, Users } from 'lucide-react';

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
  topic?: string; // Track conversation topics
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
  const [usedVerses, setUsedVerses] = useState<string[]>([]);  // Track used verses
  const [conversationTopics, setConversationTopics] = useState<string[]>([]);  // Track conversation topics
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with GraceGuide welcome message with personal greeting
    const userName = profile?.username || 'beloved friend';
    const welcomeMessage: Message = {
      id: '1',
      content: language === 'english' 
        ? `Hello, ${userName}! I'm GraceGuide, your warm Christian companion here to help you grow in faith with Scripture, devotionals, and encouragement. Think of me as that caring friend from your Bible study group — ready to walk alongside you in God's Word.\n\nWhat's on your heart today?`
        : `ሰላም፣ ${userName}! እኔ ግሬስጋይድ ነኝ፣ በስክሪፕቸር፣ በወንድምማሪና በመበረታት እምነትዎን እንዲያድጉ የሚረዳ ሞቃታማ የክርስቲያን አጋርዎ። እንደ ከመጽሐፍ ቅዱስ ጥናት ቡድንዎ የተስተዋለ ወዳጅ አድርገው ያስቡኝ — በእግዚአብሔር ቃል ከእርስዎ ጋር ለመራመድ ዝግጁ።\n\nዛሬ በልብዎ ላይ ያለው ምንድን ነው?`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [language, profile?.username]);

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

  const getRandomVerse = async (excludeUsed: boolean = true): Promise<BibleVerse | null> => {
    try {
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .limit(50);

      if (error || !data || data.length === 0) {
        console.error('Error fetching verses:', error);
        return null;
      }

      // Filter out used verses if requested
      let availableVerses = data;
      if (excludeUsed && usedVerses.length > 0) {
        availableVerses = data.filter(verse => !usedVerses.includes(verse.verse_reference));
        // If we've used all verses, reset and use all verses again
        if (availableVerses.length === 0) {
          availableVerses = data;
          setUsedVerses([]);
        }
      }

      const randomIndex = Math.floor(Math.random() * availableVerses.length);
      const selectedVerse = availableVerses[randomIndex];
      
      // Track this verse as used
      if (excludeUsed) {
        setUsedVerses(prev => [...prev, selectedVerse.verse_reference]);
      }
      
      return selectedVerse;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const generateGraceGuideResponse = async (userInput: string, previousMessages: Message[]): Promise<{ response: string; includeVerse: boolean; devotion?: any; studyPlan?: any; topic?: string }> => {
    const input = userInput.toLowerCase();
    const userName = profile?.username || 'beloved friend';
    
    // Check for repeated topics to provide different responses
    const hasDiscussedIdentity = previousMessages.some(m => m.topic === 'identity');
    const hasDiscussedPrayer = previousMessages.some(m => m.topic === 'prayer');
    const hasDiscussedWorry = previousMessages.some(m => m.topic === 'worry');
    const hasDiscussedSadness = previousMessages.some(m => m.topic === 'sadness');
    
    // Generate conversation summary if appropriate
    const shouldSummarize = previousMessages.length > 6 && Math.random() < 0.3;
    let conversationContext = '';
    if (shouldSummarize) {
      const topics = conversationTopics.slice(-3);
      if (topics.length >= 2) {
        conversationContext = `You know, ${userName}, earlier we talked about ${topics[0]}, and now we're exploring ${topics[topics.length - 1]}. I love how our conversation is flowing! `;
      }
    }
    
    if (language === 'english') {
      // Account setup requests
      if (input.includes('account') || input.includes('sign up') || input.includes('create account') || input.includes('register')) {
        return {
          response: `Welcome, ${userName}! Let's set up your account step by step:\n\n1. Choose a username\n2. Choose a password to keep your account safe\n3. Enter your email so we can send you a confirmation link\n\nEnjoy 7 days of free devotionals and study plans. After that, you can subscribe to unlock unlimited content — your support helps us reach more people with God's Word.\n\nWhat username would you like to use?`,
          includeVerse: false
        };
      }

      // Trial/subscription questions
      if (input.includes('trial') || input.includes('subscribe') || input.includes('subscription') || input.includes('keep using')) {
        return {
          response: `Wonderful, ${userName}! After your 7-day trial, you can subscribe to continue your journey in God's Word.\n\nYour subscription helps share Scripture and devotionals with others around the world — think of it as partnering with us to spread God's love!\n\nWould you like me to guide you through the subscription process now?`,
          includeVerse: false
        };
      }

      // Identity questions - rotate responses for repeated questions
      if (input.includes('identity') || input.includes('who am i') || input.includes('my identity')) {
        let response = '';
        if (!hasDiscussedIdentity) {
          response = `${conversationContext}In Christ, you are God's beloved child — forgiven, chosen, and made new.\n\n**John 1:12 (NIV):** "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God."\n\nWould you like me to share a devotion or give you a study plan on this topic?`;
        } else {
          // Different perspective for repeated question
          response = `${conversationContext}Another perspective on your identity, ${userName}: You are a new creation in Christ.\n\n**2 Corinthians 5:17 (ESV):** "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"\n\nYour past mistakes don't define your future in Him. Would you like me to share a different verse or a reflection for today?`;
        }
        return {
          response,
          includeVerse: true,
          topic: 'identity'
        };
      }

      // Prayer requests - rotate responses
      if (input.includes('pray') || input.includes('prayer')) {
        let response = '';
        if (!hasDiscussedPrayer) {
          response = `${conversationContext}Prayer is one of the most beautiful gifts God has given us — a direct line to the heart of our Father.\n\n**1 Thessalonians 5:17 (ESV):** "Pray without ceasing."\n\nGod delights in hearing from you, whether it's thanksgiving, requests, or just sharing your heart with Him.\n\nWhat would you like to pray about together today?`;
        } else {
          response = `${conversationContext}I love that you're thinking about prayer again, ${userName}! Here's another truth about prayer:\n\n**Matthew 7:7 (NIV):** "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you."\n\nGod is always listening, always ready to respond to your heart. How has prayer been feeling for you lately?`;
        }
        return {
          response,
          includeVerse: true,
          topic: 'prayer'
        };
      }

      // Worry/anxiety - rotate responses
      if (input.includes('worry') || input.includes('anxious') || input.includes('anxiety') || input.includes('stress')) {
        let response = '';
        if (!hasDiscussedWorry) {
          response = `${conversationContext}I hear the weight you're carrying, ${userName}. Anxiety can feel overwhelming, but God wants to carry those burdens with you.\n\n**Philippians 4:6-7 (NIV):** "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."\n\nYou don't have to face this alone — God is right there with you.\n\nWhat specific worry is weighing heaviest on your heart right now?`;
        } else {
          response = `${conversationContext}I see you're still wrestling with worry, ${userName}. Here's another promise to hold onto:\n\n**1 Peter 5:7 (ESV):** "Casting all your anxieties on him, because he cares for you."\n\nGod doesn't just want to help with your worries — He wants to carry them completely. What's been the hardest part about letting go of control?`;
        }
        return {
          response,
          includeVerse: true,
          topic: 'worry'
        };
      }

      // Sadness/depression - rotate responses
      if (input.includes('sad') || input.includes('depressed') || input.includes('hurt') || input.includes('down')) {
        let response = '';
        if (!hasDiscussedSadness) {
          response = `${conversationContext}I'm so sorry you're hurting, ${userName}. Your pain is real and it matters to God — He sees every tear.\n\n**Psalm 34:18 (ESV):** "The Lord is near to the brokenhearted and saves the crushed in spirit."\n\nGod doesn't promise to take away all pain immediately, but He promises to be near to you in it. You are not alone in this darkness.\n\nWhat's been the hardest part of what you're going through?`;
        } else {
          response = `${conversationContext}My heart goes out to you again, ${userName}. Here's another truth to lean on:\n\n**Psalm 147:3 (NIV):** "He heals the brokenhearted and binds up their wounds."\n\nHealing often comes slowly, but it comes. God is working even when you can't see it. How are you caring for yourself during this difficult time?`;
        }
        return {
          response,
          includeVerse: true,
          topic: 'sadness'
        };
      }

      // Devotion requests
      if (input.includes('devotion') || input.includes('give me a devotion')) {
        const verse = await getRandomVerse();
        if (verse) {
          const devotionResponse = `${conversationContext}**Theme:** ${verse.theme || "God's Love"}\n\n**Scripture:** ${verse.verse_reference}\n"${verse.english_text}"\n\n**Reflection:** ${verse.english_devotion}\n\nWould you like a 3-day study plan to go deeper into this topic, ${userName}?`;
          return {
            response: devotionResponse,
            includeVerse: true,
            devotion: {
              theme: verse.theme || "God's Love",
              verse: verse.verse_reference,
              text: verse.english_text,
              reflection: verse.english_devotion
            },
            topic: 'devotion'
          };
        }
      }

      // Study plan requests
      if (input.includes('study plan') || input.includes('study') || input.includes('deeper')) {
        const studyPlanResponse = `${conversationContext}Here are three options to grow deeper in God's Word, ${userName}:\n\n**1. Identity in Christ** — Who you are in God's eyes\n**2. Prayer and Presence** — Learning to talk with God daily\n**3. Living with Forgiveness** — Freedom from guilt and bitterness\n\nWhich one sounds good to you?`;
        return {
          response: studyPlanResponse,
          includeVerse: false,
          studyPlan: {
            options: [
              "Identity in Christ — Who you are in God's eyes",
              "Prayer and Presence — Learning to talk with God daily",
              "Living with Forgiveness — Freedom from guilt and bitterness"
            ]
          },
          topic: 'study'
        };
      }

      // General faith questions
      if (input.includes('faith') || input.includes('believe') || input.includes('god') || input.includes('jesus')) {
        const verse = await getRandomVerse();
        if (verse) {
          const response = `${conversationContext}Faith questions are so beautiful, ${userName} — they show a heart that's seeking truth.\n\n**${verse.verse_reference}:** "${verse.english_text}"\n\n${verse.english_devotion}\n\nWhat aspects of faith are you curious about or struggling with?`;
          return {
            response,
            includeVerse: true,
            topic: 'faith'
          };
        }
      }

      // Default response with follow-up question
      const defaultResponses = [
        `Thank you for sharing that with me, ${userName}. I'm here to walk alongside you in whatever you're experiencing.\n\nWhat would be most helpful for you right now — a word of encouragement, prayer, or maybe diving into Scripture together?`,
        `I appreciate you opening up, ${userName}. Your thoughts and feelings matter deeply.\n\nHow can I best support you today — through prayer, a Bible verse, or just listening?`,
        `${userName}, I'm grateful you trust me with what's on your heart.\n\nWould you like to explore this more through Scripture, or is there something else you'd like to talk about?`
      ];
      return {
        response: conversationContext + defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
        includeVerse: false
      };
    } else {
      // Amharic responses - simplified for now
      return {
        response: `እዚህ ከእርስዎ ጋር ነኝ፣ ${userName}። ዛሬ እንዴት ልረዳዎት እችላለሁ?`,
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
      // Generate GraceGuide response
      const { response, includeVerse, topic } = await generateGraceGuideResponse(currentInput, messages);
      
      // Track conversation topics
      if (topic) {
        setConversationTopics(prev => [...prev, topic].slice(-5)); // Keep last 5 topics
      }
      
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
        topic: topic,
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
              {language === 'english' ? 'GraceGuide - Your Christian Companion' : 'ግሬስጋይድ - የእርስዎ የክርስቲያን አጋር'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'english' ? 'Scripture, devotionals & faith encouragement' : 'ስክሪፕቸር፣ ወንድምማሪና የእምነት መበረታት'}
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
                ? "Ask about faith, request a devotion, or share what's on your heart..."
                : "ስለ እምነት ይጠይቁ፣ ወንድምማሪ ይጠይቁ፣ ወይም በልብዎ ያለውን ያካፍሉ..."
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