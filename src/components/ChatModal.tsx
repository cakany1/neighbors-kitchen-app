import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chefId: string;
  chefName: string;
  mealId: string;
  mealTitle: string;
}

const ChatModal = ({ open, onOpenChange, chefId, chefName, mealId, mealTitle }: ChatModalProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  
  // Check if this is a demo meal
  const isDemo = mealId?.startsWith('demo-');
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Create or get existing booking for this meal (for message threading)
  // Skip for demo meals
  const { data: booking } = useQuery({
    queryKey: ['prebooking', mealId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      // Check if booking exists
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('meal_id', mealId)
        .eq('guest_id', currentUser.id)
        .maybeSingle();
      
      // If no booking, create a temporary one with status 'inquiry'
      if (!data) {
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert({
            meal_id: mealId,
            guest_id: currentUser.id,
            status: 'inquiry',
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('Error creating inquiry booking:', error);
          return null;
        }
        
        return newBooking;
      }
      
      return data;
    },
    enabled: !!currentUser?.id && open && !isDemo,
  });

  // Fetch messages for this booking
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!booking?.id,
  });

  // Subscribe to realtime messages
  useEffect(() => {
    if (!booking?.id) return;
    
    const channel = supabase
      .channel(`messages:${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${booking.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', booking.id] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!currentUser?.id || !booking?.id) throw new Error('Not authenticated');
      
      const { data: { user } } = await supabase.auth.getUser();
      const userLang = user?.user_metadata?.language || 'de';
      
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: booking.id,
          sender_id: currentUser.id,
          message_text: messageText,
          original_language: userLang,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setInputMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', booking?.id] });
      toast.success(t('chat.message_sent'));
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(t('chat.send_failed'));
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessageMutation.mutate(inputMessage);
  };

  if (!currentUser) {
    return null;
  }

  // Demo meal chat prevention
  if (isDemo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💬 {t('chat.demo_title')}
            </DialogTitle>
            <DialogDescription>
              {t('chat.demo_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('chat.demo_hint')}
            </p>
            <Button onClick={() => onOpenChange(false)}>
              {t('common.understood')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Frage an {chefName}</DialogTitle>
          <DialogDescription>
            Stelle Fragen zum Gericht "{mealTitle}" bevor du buchst
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Starte die Konversation mit {chefName}</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender_id === currentUser.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.message_text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Textarea
            placeholder="Deine Nachricht..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 min-h-[60px]"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="self-end"
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
