import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Send, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  original_language: string;
  created_at: string;
}

const Chat = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [showTranslations, setShowTranslations] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });

  // Get booking details
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          meal:meals(
            *,
            chef_profile:profiles(*)
          )
        `)
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;
      
      // Also get chef and guest profiles separately
      const { data: guestProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.guest_id)
        .single();
      
      const { data: chefProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.meal.chef_id)
        .single();
      
      return {
        ...data,
        guest: guestProfile,
        meal: {
          ...data.meal,
          chef: chefProfile,
        },
      };
    },
  });

  // Get messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Translate message when needed
  useEffect(() => {
    if (!messages || !currentUser?.profile || !booking) return;

    messages.forEach(async (msg) => {
      // Only translate if sender and receiver have different languages
      const senderLanguage = msg.original_language;
      const receiverLanguage = currentUser.profile.language;
      
      if (senderLanguage !== receiverLanguage && !translations[msg.id] && showTranslations) {
        try {
          const { data } = await supabase.functions.invoke('translate-message', {
            body: {
              text: msg.message_text,
              sourceLanguage: senderLanguage,
              targetLanguage: receiverLanguage,
            },
          });

          if (data?.translatedText) {
            setTranslations(prev => ({
              ...prev,
              [msg.id]: data.translatedText,
            }));
          }
        } catch (error) {
          console.error('Translation error:', error);
        }
      }
    });
  }, [messages, currentUser, booking, translations, showTranslations]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: currentUser.id,
          message_text: text,
          original_language: currentUser.profile.language,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error(error);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  if (!booking || !currentUser) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const otherPerson = currentUser.id === booking.meal.chef.id ? booking.guest : booking.meal.chef;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      
      <main className="max-w-lg mx-auto">
        {/* Chat Header */}
        <div className="bg-card border-b border-border px-4 py-4 sticky top-16 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 bg-primary/10">
                <div className="w-full h-full flex items-center justify-center text-primary font-semibold">
                  {otherPerson.first_name.charAt(0)}
                </div>
              </Avatar>
              <div>
                <h2 className="font-semibold text-foreground">
                  {otherPerson.first_name} {otherPerson.last_name}
                </h2>
                <p className="text-xs text-muted-foreground">{booking.meal.title}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslations(!showTranslations)}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {showTranslations ? 'Hide' : 'Show'} Translation
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-6 space-y-4">
          {/* Translation Notice */}
          {booking && currentUser?.profile && 
           booking.meal.chef.language !== booking.guest.language && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4 flex items-start gap-2">
              <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Auto-Translation Active:</strong> You and your chat partner speak different languages. 
                Messages will be automatically translated to help you communicate.
              </div>
            </div>
          )}
          
          {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUser.id;
            const needsTranslation = msg.original_language !== currentUser.profile.language;
            const translatedText = translations[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[70%] p-3 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <p className={isCurrentUser ? 'text-primary-foreground' : 'text-foreground'}>
                    {msg.message_text}
                  </p>
                  
                  {needsTranslation && showTranslations && translatedText && (
                    <div className={`mt-2 pt-2 border-t ${isCurrentUser ? 'border-primary-foreground/20' : 'border-border'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3 opacity-70" />
                        <span className="text-xs opacity-70">Translated:</span>
                      </div>
                      <p className="text-sm opacity-90">{translatedText}</p>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 max-w-lg mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!messageText.trim() || sendMessageMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
