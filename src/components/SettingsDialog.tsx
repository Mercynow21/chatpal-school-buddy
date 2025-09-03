import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, Calendar, User, Mail, Phone, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchSubscriptionData();
    }
  }, [open, user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, trial_end')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscriptionData(data || {
        subscribed: false,
        subscription_tier: 'trial',
        subscription_end: null,
        trial_end: null
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open the customer portal in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isTrialActive = subscriptionData && !subscriptionData.subscribed && subscriptionData.subscription_tier === 'trial';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile and subscription details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user?.email}</span>
              </div>
              {profile?.username && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm">{profile.username}</span>
                </div>
              )}
              {profile?.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{profile.phone_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading subscription details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptionData ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          subscriptionData.subscribed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : isTrialActive
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {subscriptionData.subscribed 
                            ? 'Active Subscription' 
                            : isTrialActive 
                            ? 'Free Trial' 
                            : 'No Active Subscription'}
                        </span>
                      </div>
                      
                      {subscriptionData.subscription_tier && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Plan:</span>
                          <span className="text-sm capitalize">{subscriptionData.subscription_tier}</span>
                        </div>
                      )}
                      
                      {(subscriptionData.subscription_end || isTrialActive) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {subscriptionData.subscribed ? 'Renewal Date:' : 'Trial Ends:'}
                          </span>
                          <span className="text-sm">
                            {subscriptionData.subscribed 
                              ? formatDate(subscriptionData.subscription_end)
                              : 'December 10, 2024'
                            }
                          </span>
                        </div>
                      )}
                      
                      {subscriptionData.subscribed && (
                        <div className="pt-4 border-t">
                          <div className="flex items-start gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">Manage Your Subscription</p>
                              <p>Cancel, change payment method, or modify your plan through our secure portal.</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={handleManageSubscription}
                            disabled={cancelling}
                            className="w-full"
                          >
                            {cancelling ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Opening Portal...
                              </>
                            ) : (
                              'Manage Subscription'
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {!subscriptionData.subscribed && (
                        <div className="pt-4 border-t">
                          <div className="text-sm text-muted-foreground mb-3">
                            <p className="font-medium text-foreground">Ready to Continue?</p>
                            <p>Subscribe to continue your spiritual journey with unlimited access to devotionals and study plans.</p>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleSubscribe}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting Checkout...
                              </>
                            ) : (
                              'Subscribe Now'
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No subscription information available.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;