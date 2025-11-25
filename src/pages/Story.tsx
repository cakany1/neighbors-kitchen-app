import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useTranslation } from "react-i18next";

const StoryPage = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full bg-red-100 text-red-600 text-sm font-medium mb-4">
            Made with ❤️ in Basel
          </span>
          <h1 className="text-4xl font-bold mb-6">
            {isEn ? "Our Story: An Idea Born from Daily Life" : "Unsere Geschichte: Eine Idee aus dem Alltag"}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 md:order-1">
            {/* STABILIES BILD (Unsplash) statt lokaler Pfad */}
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=800&q=80"
              alt="Neighbors sharing food"
              className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/5]"
            />
          </div>

          <div className="order-1 md:order-2 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              {isEn
                ? "The idea for Neighbors Kitchen grew out of very personal moments: When I was once cleaning out my fridge and had to throw away perfectly good food, I asked myself if I couldn't find a better way to share it."
                : "Die Idee zu Neighbors Kitchen entstand aus ganz persönlichen Momenten: Als ich einmal meinen Kühlschrank ausmistete und gutes Essen wegwerfen musste, fragte ich mich, ob ich es nicht besser teilen könnte."}
            </p>
            <p>
              {isEn
                ? "My girlfriend loves to cook for many people—but our friends don't live just around the corner."
                : "Meine Freundin liebt es, für viele Menschen zu kochen – doch unsere Freunde wohnen oft nicht gleich um die Ecke."}
            </p>
            <p>
              {isEn
                ? "Or do you know that feeling when a wonderful aroma drifts over from the neighbors because they're preparing something delicious? That's how Neighbors Kitchen was born. Perhaps by sharing food, we can move a little closer together again."
                : "Oder kennst du das Gefühl, wenn ein wunderbarer Duft vom Nachbarn kommt, weil er gerade etwas Leckeres zubereitet? So entstand Neighbors Kitchen. Vielleicht können wir durch das Teilen von Essen wieder ein wenig näher zusammenrücken."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryPage;
