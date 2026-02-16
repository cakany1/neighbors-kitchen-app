import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { Heart, Users, Leaf, Home, Building2 } from "lucide-react";

const StoryPage = () => {
  const { t } = useTranslation();

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
              {t('story.our_story')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('story.idea_born')}
            </p>
          </div>
        </section>

        {/* Main Story Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
              <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery/neighbors-sharing.jpg`}
                  alt="Neighbors sharing food"
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover aspect-[4/5]"
                />
              </div>

              <div className="order-1 md:order-2 space-y-6">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t('story.paragraph1')}
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">
                    {t('story.my_girlfriend')}
                  </strong>{" "}
                  {t('story.paragraph2')}
                </p>
              </div>
            </div>

            {/* Second Section - The Feeling */}
            <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 mb-20">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-lg md:text-xl leading-relaxed text-muted-foreground italic">
                  {t('story.paragraph3')}
                </p>
              </div>
            </div>

            {/* Vision Section */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                {t('story.vision_title')}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('story.vision_text')}
              </p>
            </div>

            {/* Values Grid */}
             <div className="grid md:grid-cols-4 gap-6">
               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Users className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {t('story.community')}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {t('story.community_desc')}
                 </p>
               </div>

               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Leaf className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {t('story.sustainability')}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {t('story.sustainability_desc')}
                 </p>
               </div>

               <div className="text-center p-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Home className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {t('story.home_cooking')}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {t('story.home_cooking_desc')}
                 </p>
               </div>

               <a href="/partnerships" className="text-center p-6 rounded-xl hover:bg-primary/5 transition-colors group cursor-pointer">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                   <Building2 className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">
                   {t('story.for_institutions')}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {t('story.for_institutions_desc')}
                 </p>
                 <p className="text-primary text-sm mt-2 group-hover:underline">
                   {t('story.learn_more')}
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
