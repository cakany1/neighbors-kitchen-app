import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Award, ChefHat, Heart } from 'lucide-react';

const Profile = () => {
  // Mock user data
  const user = {
    firstName: 'Alex',
    lastName: 'Chen',
    karma: 178,
    mealsShared: 23,
    mealsReceived: 31,
    fairPayments: 28,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-trust-gold fill-current" />
                  <span className="text-lg font-semibold text-trust-gold">{user.karma} Karma</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{user.mealsShared}</p>
                <p className="text-xs text-muted-foreground">Meals Shared</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{user.mealsReceived}</p>
                <p className="text-xs text-muted-foreground">Meals Received</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-trust-badge">{user.fairPayments}</p>
                <p className="text-xs text-muted-foreground">Fair Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-trust-gold" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-light p-4 rounded-lg text-center">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <p className="font-semibold text-sm text-foreground">Chef Master</p>
                <p className="text-xs text-muted-foreground">20+ meals shared</p>
              </div>
              <div className="bg-primary-light p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm text-foreground">Fair Payer</p>
                <p className="text-xs text-muted-foreground">Always pays fairly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust System Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Karma Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Share Meals</p>
                <p className="text-xs text-muted-foreground">Earn karma by sharing your cooking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Pay Fairly</p>
                <p className="text-xs text-muted-foreground">Build trust by fair payments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-trust-badge/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-trust-gold" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Be Respectful</p>
                <p className="text-xs text-muted-foreground">Respect hosts and bring your own container</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Always bring your own container for meals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Be punctual and respect the chef's time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Pay fairly based on the quality and effort</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Respect privacy - don't share exact addresses publicly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Communicate dietary restrictions clearly</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground">
            Settings
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
