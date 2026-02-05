import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Users, User, Loader2, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

interface AdminMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserProfile[];
  preselectedUser?: UserProfile | null;
}

export function AdminMessageDialog({ 
  open, 
  onOpenChange, 
  users,
  preselectedUser 
}: AdminMessageDialogProps) {
  const [mode, setMode] = useState<'all' | 'selected'>(preselectedUser ? 'selected' : 'all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    preselectedUser ? new Set([preselectedUser.id]) : new Set()
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const nickname = user.nickname?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || nickname.includes(searchQuery.toLowerCase());
  });

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Betreff und Nachricht sind erforderlich');
      return;
    }

    if (mode === 'selected' && selectedUserIds.size === 0) {
      toast.error('Bitte wähle mindestens einen Empfänger');
      return;
    }

    setIsSending(true);

    try {
      const targetUserIds = mode === 'all' 
        ? users.map(u => u.id) 
        : Array.from(selectedUserIds);

      const { data, error } = await supabase.functions.invoke('send-admin-message', {
        body: {
          userIds: targetUserIds,
          subject,
          message
        }
      });

      if (error) throw error;

      const successCount = data?.successCount || targetUserIds.length;
      toast.success(`Nachricht an ${successCount} User gesendet`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUserIds(new Set());
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Fehler beim Senden der Nachricht');
    } finally {
      setIsSending(false);
    }
  };

  const recipientCount = mode === 'all' ? users.length : selectedUserIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Admin-Nachricht versenden
          </DialogTitle>
          <DialogDescription>
            Sende E-Mail-Nachrichten an alle oder ausgewählte User
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Mode Selection */}
          <div className="space-y-2">
            <Label>Empfänger</Label>
            <RadioGroup 
              value={mode} 
              onValueChange={(v) => setMode(v as 'all' | 'selected')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Alle User ({users.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Ausgewählte User
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* User Selection (if selected mode) */}
          {mode === 'selected' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="User suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Selected users preview */}
              {selectedUserIds.size > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                  {Array.from(selectedUserIds).map(userId => {
                    const user = users.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {user.first_name} {user.last_name}
                        <button 
                          onClick={() => toggleUser(userId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedUserIds.has(user.id) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <Checkbox 
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                        <AvatarFallback>{user.first_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.nickname && (
                          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              placeholder="z.B. Wichtige Ankündigung"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              placeholder="Deine Nachricht an die Community..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

          {/* Send Button */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-muted-foreground">
              {recipientCount} Empfänger ausgewählt
            </span>
            <Button 
              onClick={handleSend} 
              disabled={isSending || recipientCount === 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sende...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Nachricht senden
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
