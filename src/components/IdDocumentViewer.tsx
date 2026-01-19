import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface IdDocumentViewerProps {
  filePath: string;
  userId: string;
}

export const IdDocumentViewer = ({ filePath, userId }: IdDocumentViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a signed URL for the private file (valid for 60 seconds)
      const { data, error: signError } = await supabase.storage
        .from('id-documents')
        .createSignedUrl(filePath, 60);

      if (signError) throw signError;
      
      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
    } catch (err) {
      console.error('Error loading ID document:', err);
      setError('Dokument konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 gap-2"
          onClick={loadImage}
        >
          <Eye className="w-4 h-4" />
          ID-Dokument anzeigen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🪪 ID-Dokument zur Verifizierung
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-destructive py-8 justify-center">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          {imageUrl && !loading && (
            <div className="space-y-4">
              <img 
                src={imageUrl} 
                alt="ID-Dokument" 
                className="w-full rounded-lg border border-border"
                onError={() => setError('Bild konnte nicht geladen werden')}
              />
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Dieses Dokument wird nach Genehmigung automatisch gelöscht
              </p>
            </div>
          )}
          
          {!imageUrl && !loading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              Klicke auf "ID-Dokument anzeigen" um das Bild zu laden
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
