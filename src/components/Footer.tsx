import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4 text-center space-y-4">
        <p className="text-sm text-muted-foreground">© {currentYear} Neighbors Kitchen Basel</p>

        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {/* Impressum */}
          <Link to="/impressum" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("footer.imprint")}
          </Link>
          <span className="text-muted-foreground/30">|</span>

          {/* AGB */}
          <Link to="/agb" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("footer.terms_privacy")}
          </Link>
          <span className="text-muted-foreground/30">|</span>

          {/* Kontakt */}
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("footer.contact")}
          </Link>
          <span className="text-muted-foreground/30">|</span>

          {/* NEU: Über uns */}
          <Link to="/story" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("landing.about_us")}
          </Link>
          <span className="text-muted-foreground/30">|</span>

          {/* NEU: FAQ */}
          <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
          <span className="text-muted-foreground/30">|</span>

          {/* Install App (Hervorgehoben) */}
          <Link
            to="/install"
            className="flex items-center gap-1 text-primary font-medium hover:text-primary/80 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            {t("footer.install_app")}
          </Link>
        </div>
      </div>
    </footer>
  );
};
