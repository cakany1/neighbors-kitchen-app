import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="max-w-lg mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          © {currentYear} Neighbors Kitchen Basel
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link 
            to="/impressum" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Impressum
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link 
            to="/agb" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            AGB & Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
};
