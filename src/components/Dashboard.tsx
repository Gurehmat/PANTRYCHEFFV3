import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { usePantryStore } from '../store/pantryStore';
import ExpiryBanner from './common/ExpiryBanner';
import PantryStats from './dashboard/PantryStats';

export default function Dashboard() {
  const pantryItems = usePantryStore((state) => state.pantryItems);

  return (
    <div className="space-y-8">
      <ExpiryBanner items={pantryItems} />
      <PantryStats />
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Welcome back, Chef!</h1>
        <p className="text-orange-100 text-lg max-w-2xl mb-6">
          You have {pantryItems.length} items in your pantry. Let&apos;s cook something delicious
          today.
        </p>
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm"
        >
          <Sparkles className="w-5 h-5" />
          Find Matching Recipes
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 mb-2">My Pantry</h2>
          <p className="text-gray-500 mb-4">
            Manage your ingredients and keep track of expiration dates.
          </p>
          <Link
            to="/pantry"
            className="text-orange-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Go to Pantry <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recipe Discovery</h2>
          <p className="text-gray-500 mb-4">Browse recipes that match your current ingredients.</p>
          <Link
            to="/recipes"
            className="text-orange-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse Recipes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm hover:border-yellow-200 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Magic Recipe Generator
        </h2>
        <p className="text-gray-600 mb-4">
          Don&apos;t know what to cook? Let AI invent a unique recipe based specifically on your
          ingredients.
        </p>
        <Link
          to="/generator"
          className="inline-flex items-center gap-2 bg-white text-yellow-600 px-4 py-2 rounded-lg font-bold border border-yellow-200 hover:bg-yellow-50 transition-colors"
        >
          Generate a Recipe <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
