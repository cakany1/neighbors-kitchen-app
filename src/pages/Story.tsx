import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Story = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Unsere Geschichte</h1>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Made with ❤️ in Basel
          </Badge>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Neighbors Kitchen ist eine hyperlocale Food-Sharing-Plattform für Basel. 
              Unser Ziel: Lebensmittelverschwendung reduzieren, Nachbarn verbinden und 
              eine multikulturelle Community aufbauen.
            </p>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
};

export default Story;
