import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import ChristianChatBot from '@/components/ChristianChatBot';
import { Cross, LogOut, Settings, Crown } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-chat flex flex-col">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-button">
              <Cross className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GraceGuide</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.username || user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-secondary" />
                  <div className="text-sm">
                    <div className="font-medium">Free Trial</div>
                    <div className="text-xs text-muted-foreground">7 days remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <ChristianChatBot />
      </main>
    </div>
  );
};

export default Index;