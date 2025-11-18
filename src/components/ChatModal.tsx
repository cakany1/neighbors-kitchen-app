import { useState } from 'react';
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

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'chef';
  timestamp: Date;
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chefName: string;
  mealTitle: string;
}

const ChatModal = ({ open, onOpenChange, chefName, mealTitle }: ChatModalProps) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hallo! Ich interessiere mich für "${mealTitle}". Ist es möglich, mehr darüber zu erfahren?`,
      sender: 'user',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate chef response
    setTimeout(() => {
      const chefResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Vielen Dank für deine Nachricht! Ja, gerne. Was möchtest du wissen?',
        sender: 'chef',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, chefResponse]);
    }, 1500);

    toast.success('Nachricht gesendet');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Frage an {chefName}</DialogTitle>
          <DialogDescription>
            Stelle Fragen zum Gericht "{mealTitle}" bevor du buchst
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('de-DE', {
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
          />
          <Button onClick={handleSendMessage} size="icon" className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
