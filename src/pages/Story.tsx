import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { Heart, Users, Leaf, Home, Building2 } from "lucide-react";

const StoryPage = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Made with <Heart className="w-4 h-4 fill-current" /> in Basel
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {isEn ? "Our Story" : "Unsere Geschichte"}
            </h1>
            <p className="text-xl text-muted-foreground">
              {isEn ? "An Idea Born from Daily Life" : "Eine Idee aus dem Alltag"}
            </p>
          </div>
        </section>

        {/* Main Story Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
              <img
                  src="https://ziyocgrzijovpfhzutzs.supabase.co/storage/v1/object/public/gallery/neighbors-sharing.jpg"
                  alt="Neighbors sharing food"
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover aspect-[4/5]"
                />
              </div>

              <div className="order-1 md:order-2 space-y-6">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {isEn
                    ? "The idea for Neighbors Kitchen grew out of very personal moments: When I was once cleaning out my fridge and had to throw away perfectly good food, I asked myself if I couldn't find a better way to share it."
                    : "Die Idee zu Neighbors Kitchen entstand aus ganz persönlichen Momenten: Als ich einmal meinen Kühlschrank ausmistete und gutes Essen wegwerfen musste, fragte ich mich, ob ich es nicht besser teilen könnte."}
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">
                    {isEn ? "My girlfriend" : "Meine Freundin"}
                  </strong>{" "}
                  {isEn
                    ? "loves to cook for many people—but our friends don't live just around the corner."
                    : "liebt es, für viele Menschen zu kochen – doch unsere Freunde wohnen oft nicht gleich um die Ecke."}
                </p>
              </div>
            </div>

            {/* Second Section - The Feeling */}
            <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 mb-20">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-lg md:text-xl leading-relaxed text-muted-foreground italic">
                  {isEn
                    ? "Or do you know that feeling when a wonderful aroma drifts over from the neighbors because they're preparing something delicious? It's such a shame when someone cooks too much—which happens often—and the food then gets thrown away or overeaten, neither of which is ideal."
                    : "Oder kennst du das Gefühl, wenn ein wunderbarer Duft vom Nachbarn kommt, weil er gerade etwas Leckeres zubereitet? Es ist so schade, wenn jemand zu viel kocht – was ja öfter vorkommt – und das Essen dann weggeworfen oder zu viel gegessen wird, was beides nicht ideal ist."}
                </p>
              </div>
            </div>

            {/* Vision Section */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                {isEn ? "So Neighbors Kitchen was born" : "So entstand Neighbors Kitchen"}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {isEn
                  ? "The neighbor's kitchen. In Switzerland, we are often distant from our neighbors. Perhaps by sharing food, we can move a little closer together again, strengthen the community, and at the same time do something good for the environment by cooking more sustainably and producing less waste."
                  : "Die Nachbars Küche. In der Schweiz sind wir oft distanziert zu unseren Nachbarn. Vielleicht können wir durch das Teilen von Essen wieder ein wenig näher zusammenrücken, die Gemeinschaft stärken und gleichzeitig etwas Gutes für die Umwelt tun, indem wir nachhaltiger kochen und weniger Abfall produzieren."}
              </p>
            </div>

            {/* Values Grid */}
             <div className="grid md:grid-cols-4 gap-6">
               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Users className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {isEn ? "Community" : "Gemeinschaft"}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {isEn
                     ? "Connect with neighbors through the joy of sharing food"
                     : "Verbinde dich mit Nachbarn durch die Freude am Teilen"}
                 </p>
               </div>

               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Leaf className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {isEn ? "Sustainability" : "Nachhaltigkeit"}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {isEn
                     ? "Reduce food waste and cook more consciously"
                     : "Reduziere Lebensmittelverschwendung und koche bewusster"}
                 </p>
               </div>

               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Home className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {isEn ? "Home Cooking" : "Hausgemacht"}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {isEn
                     ? "Enjoy authentic, homemade meals from your neighborhood"
                     : "Geniesse authentische, hausgemachte Gerichte aus der Nachbarschaft"}
                 </p>
               </div>

               <a href="/partnerships" className="text-center p-6 rounded-xl hover:bg-primary/5 transition-colors group cursor-pointer">
                 <div className="w-16 h-16 rounded-full bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                   <Building2 className="w-8 h-8 text-secondary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                   {isEn ? "For Institutions" : "Für Institutionen"}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {isEn
                     ? "Partnerships for districts, municipalities & organizations"
                     : "Partnerschaften für Quartiere, Gemeinden & Organisationen"}
                 </p>
               </a>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StoryPage;
