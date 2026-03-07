import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export interface CookModeRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
}

interface CookModeProps {
  recipe: CookModeRecipe;
  onClose: () => void;
}

export default function CookMode({ recipe, onClose }: CookModeProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const steps = recipe.instructions.filter((s) => String(s).trim());
  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  const toggleIngredient = (i: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-amber-50/95 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-amber-200 bg-white/80">
        <h1 className="text-xl font-bold text-gray-900 truncate pr-2">{recipe.title}</h1>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          aria-label="Close Cook Mode"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <section className="md:w-80 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const checked = checkedIngredients.has(i);
              return (
                <li key={i} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleIngredient(i)}
                    className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      checked
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-orange-400'
                    }`}
                    aria-label={checked ? `Uncheck ${ing}` : `Check ${ing}`}
                  >
                    {checked ? <Check className="w-4 h-4" /> : null}
                  </button>
                  <span
                    className={`text-lg ${checked ? 'line-through text-gray-500' : 'text-gray-800'}`}
                  >
                    {ing}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 text-sm font-medium text-gray-500">
            Step {stepIndex + 1} of {totalSteps || 1}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {totalSteps > 0 && currentStep ? (
              <p className="text-2xl md:text-3xl text-gray-900 leading-relaxed">
                {currentStep.replace(/<[^>]*>?/gm, '').trim()}
              </p>
            ) : (
              <p className="text-xl text-gray-500 italic">No instructions for this recipe.</p>
            )}
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white border-2 border-orange-200 text-orange-700 font-bold text-lg hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              disabled={stepIndex >= steps.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          {steps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                    i === stepIndex
                      ? 'bg-orange-500 text-white'
                      : i < stepIndex
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
