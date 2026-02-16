import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Shield, Database, Lock, Trash2, Brain, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = 'Privacy Policy – Neighbors Kitchen';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Datenschutzerklärung von Neighbors Kitchen. Informationen zur Verarbeitung personenbezogener Daten, Google OAuth, Speicherung und Ihren Rechten.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('legal.back_home')}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Datenschutzerklärung</h1>
        <p className="text-muted-foreground mb-6">Zuletzt aktualisiert: Februar 2025</p>

        {/* English Disclaimer (only shown when language is EN) */}
        {i18n.language === 'en' && (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Note: For legal reasons, this privacy policy is currently available in German only. 
              In case of doubt, the German version applies.
            </p>
          </div>
        )}

        <div className="space-y-8 text-foreground">
          
          {/* 1. Einleitung */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              1. Datenschutz bei Neighbors Kitchen
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Neighbors Kitchen ist eine Community-Plattform für das Teilen von selbstgekochtem Essen in Basel. 
              Wir respektieren Ihre Privatsphäre und behandeln Ihre personenbezogenen Daten vertraulich. 
              Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir erheben, wie wir sie verwenden 
              und welche Rechte Sie haben.
            </p>
          </section>

          {/* 2. Welche Daten wir erfassen */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              2. Welche personenbezogenen Daten wir erfassen
            </h2>
            
            <h3 className="font-medium mt-4 mb-2">Bei Anmeldung via Google OAuth:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>E-Mail-Adresse (zur Account-Erstellung und Kommunikation)</li>
              <li>Anzeigename (für Ihr Profil)</li>
              <li>Profilbild (optional, falls Sie eines bei Google hinterlegt haben)</li>
            </ul>

            <h3 className="font-medium mt-4 mb-2">App-interne Daten:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Benutzername / Nickname</li>
              <li>Standort (nur als ungefähre Zone – exakte Adressen sind niemals öffentlich)</li>
              <li>Angebote, die Sie erstellen</li>
              <li>Buchungen, die Sie tätigen</li>
              <li>Nachrichten im Buchungs-Chat</li>
            </ul>
          </section>

          {/* 3. Nutzung der Google-Daten */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              3. Nutzung der Google-Daten
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Die von Google erhaltenen Daten werden ausschliesslich für folgende Zwecke verwendet:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Erstellung und Verwaltung Ihres Benutzerkontos</li>
              <li>Login-Authentifizierung</li>
              <li>Anzeige Ihres Namens und Profilbilds in der App</li>
            </ul>
            
            <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg">
              <p className="font-medium mb-2">Wir verwenden Ihre Google-Daten NICHT für:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Werbung oder Marketing</li>
                <li>Tracking oder Profiling</li>
                <li>Verkauf oder Weitergabe an Dritte</li>
                <li>Analyse zu kommerziellen Zwecken</li>
              </ul>
            </div>
          </section>

          {/* 4. Speicherung */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              4. Speicherung
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Ihre Daten werden in einer PostgreSQL-Datenbank bei Supabase gespeichert.</li>
              <li>Server-Standort: Schweiz (AWS Zürich, eu-central-2).</li>
              <li>Ihre Daten unterliegen dem Schweizer Datenschutzgesetz (DSG) und verlassen die Schweiz nicht.</li>
              <li>Bei Login via Google OAuth speichern wir keine Passwörter – die Authentifizierung erfolgt direkt über Google.</li>
              <li>Daten werden so lange gespeichert, wie Ihr Konto aktiv ist.</li>
            </ul>
          </section>

          {/* 5. Weitergabe */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Weitergabe an Dritte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir geben Ihre personenbezogenen Daten grundsätzlich nicht an Dritte weiter. 
              Eine Ausnahme besteht nur, wenn wir gesetzlich dazu verpflichtet sind 
              (z.B. auf Anordnung einer Behörde oder eines Gerichts).
            </p>
          </section>

          {/* 6. Löschung */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-primary" />
              6. Löschung Ihrer Daten
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Sie haben jederzeit das Recht, die Löschung Ihres Kontos zu verlangen. Bei einer Löschung werden:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Alle Ihre Profildaten entfernt</li>
              <li>Ihre Angebote und Buchungshistorie anonymisiert oder gelöscht</li>
              <li>Ihre Verbindung zu Google OAuth aufgehoben</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Zur Löschung kontaktieren Sie uns unter:{' '}
              <a href="mailto:hello@neighbors-kitchen.ch" className="text-primary hover:underline">
                hello@neighbors-kitchen.ch
              </a>
            </p>
          </section>

          {/* 7. KI / Machine Learning */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              7. Künstliche Intelligenz / Machine Learning
            </h2>
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-muted-foreground leading-relaxed font-medium">
                Ihre über Google OAuth erhaltenen Daten werden NICHT für das Training von 
                KI-Modellen (Artificial Intelligence) oder Machine Learning verwendet.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Falls wir in der App KI-Funktionen anbieten (z.B. Übersetzung von Beschreibungen), 
              werden dabei keine personenbezogenen Daten aus Ihrem Google-Konto verwendet.
            </p>
          </section>

          {/* 8. Google API Services User Data Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Einhaltung der Google API Services User Data Policy</h2>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-foreground leading-relaxed">
                <strong>Limited Use Disclosure:</strong> Neighbors Kitchen's use and transfer of information 
                received from Google APIs adheres to the{' '}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Konkret bedeutet dies:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Wir verwenden Google-Nutzerdaten nur für die in dieser Richtlinie beschriebenen Zwecke.</li>
              <li>Wir übertragen Google-Nutzerdaten nicht an Dritte (ausser wenn nötig für App-Funktionalität, mit Zustimmung, oder aus rechtlichen Gründen).</li>
              <li>Wir verwenden Google-Nutzerdaten nicht für Werbung.</li>
              <li>Menschen lesen Ihre Daten nur mit Ihrer Zustimmung, aus Sicherheitsgründen, zur Einhaltung von Gesetzen, oder für interne Operationen.</li>
            </ul>
          </section>

          {/* 9. Sicherheit */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              9. Sicherheitsmassnahmen
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Wir schützen Ihre Daten durch technische und organisatorische Massnahmen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Row Level Security (RLS):</strong> Jeder Nutzer kann nur auf seine eigenen Daten zugreifen.</li>
              <li><strong>Verschlüsselte Verbindung:</strong> Alle Datenübertragungen erfolgen über HTTPS.</li>
              <li><strong>Adressschutz:</strong> Exakte Adressen von Gastgebern werden erst nach bestätigter Buchung angezeigt – niemals öffentlich.</li>
              <li><strong>Fuzzy Location:</strong> Auf Karten wird nur ein ungefährer Standortbereich angezeigt.</li>
              <li><strong>Zugriffskontrolle:</strong> Admin-Funktionen sind durch Rollen und Berechtigungen geschützt.</li>
            </ul>
          </section>

          {/* 10. Kontakt */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              10. Kontakt & Verantwortliche Stelle
            </h2>
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-foreground mb-2"><strong>Verantwortliche Stelle:</strong></p>
              <p className="text-muted-foreground">
                Neighbors Kitchen<br />
                c/o Yagiz Cakan<br />
                Basel, Schweiz
              </p>
              <p className="text-muted-foreground mt-3">
                <a href="mailto:hello@neighbors-kitchen.ch" className="text-primary hover:underline">
                  hello@neighbors-kitchen.ch
                </a>
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte (Auskunft, Berichtigung, Löschung) 
              wenden Sie sich bitte an die oben genannte Adresse.
            </p>
          </section>

        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Privacy;
