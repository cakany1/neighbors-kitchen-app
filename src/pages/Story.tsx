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
          <CardContent className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Unsere Geschichte: Eine Idee aus dem Alltag
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Die Idee zu Neighbors Kitchen entstand aus ganz persönlichen Momenten: Als ich einmal meinen Kühlschrank ausmistete und gutes Essen wegwerfen musste, fragte ich mich, ob ich es nicht besser teilen könnte. Meine Freundin liebt es, für viele Menschen zu kochen – doch unsere Freunde wohnen oft nicht gleich um die Ecke.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Oder kennst du das Gefühl, wenn ein wunderbarer Duft vom Nachbarn kommt, weil er gerade etwas Leckeres zubereitet? Es ist so schade, wenn jemand zu viel kocht – was ja öfter vorkommt – und das Essen dann weggeworfen oder zu viel gegessen wird, was beides nicht ideal ist.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              So entstand Neighbors Kitchen – die Nachbars Küche. In der Schweiz sind wir oft distanziert zu unseren Nachbarn. Vielleicht können wir durch das Teilen von Essen wieder ein wenig näher zusammenrücken, die Gemeinschaft stärken und gleichzeitig etwas Gutes für die Umwelt tun, indem wir nachhaltiger kochen und weniger Abfall produzieren.
            </p>

            <img 
              src="/storage/Gallery/neighbors-sharing.jpg" 
              alt="Nachbarn teilen Essen im Hausflur" 
              className="w-full h-auto object-cover rounded-lg shadow-md" 
            />
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
};

export default Story;
