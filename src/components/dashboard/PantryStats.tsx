import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, CheckCircle, CircleDashed } from 'lucide-react';
import { usePantryStore } from '../../store/pantryStore';
import { useRecipeStore } from '../../store/recipeStore';
import { getRecipeMatches } from '../../utils/recipeMatching';
import { getExpiryAlerts } from '../../utils/expiryChecker';

export default function PantryStats() {
  const pantryItems = usePantryStore((state) => state.pantryItems);
  const recipes = useRecipeStore((state) => state.recipes);

  const stats = useMemo(() => {
    const totalPantry = pantryItems.length;
    const expiryAlerts = getExpiryAlerts(pantryItems);
    const expiringSoonCount = expiryAlerts.length;

    let canMakeFull = 0;
    let canMakeAlmost = 0;
    for (const recipe of recipes) {
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      const result = getRecipeMatches(pantryItems, {
        id: recipe.id,
        title: recipe.title,
        ingredients,
      });
      if (result.matchPercentage >= 80) canMakeFull++;
      else if (result.matchPercentage >= 60 && result.matchPercentage < 80) canMakeAlmost++;
    }

    return {
      totalPantry,
      expiringSoonCount,
      canMakeFull,
      canMakeAlmost,
    };
  }, [pantryItems, recipes]);

  const cards = [
    {
      label: 'Total pantry items',
      value: stats.totalPantry,
      icon: Package,
      iconBg: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Items expiring soon',
      value: stats.expiringSoonCount,
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-600',
      link: '/pantry',
    },
    {
      label: 'Recipes you can make (80%+)',
      value: stats.canMakeFull,
      icon: CheckCircle,
      iconBg: 'bg-green-100 text-green-600',
      link: '/recipes',
    },
    {
      label: 'Recipes almost there (60–79%)',
      value: stats.canMakeAlmost,
      icon: CircleDashed,
      iconBg: 'bg-blue-100 text-blue-600',
      link: '/recipes',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <div className="rounded-lg shadow-sm p-4 bg-white border border-gray-100 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${card.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        );
        if (card.link) {
          return (
            <Link
              key={card.label}
              to={card.link}
              className="block hover:opacity-90 transition-opacity"
            >
              {content}
            </Link>
          );
        }
        return <div key={card.label}>{content}</div>;
      })}
    </div>
  );
}
