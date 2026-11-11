import React, { useState } from 'react';
import type { DealItem } from '../../types';
import { X, Sparkles, ChefHat, Play, CheckCircle2, Clock, Flame, Snowflake, Plus, Trash2 } from 'lucide-react';
import { sounds } from '../../lib/soundEffects';

interface FlashChefAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeal?: DealItem | null;
}

interface Recipe {
  title: string;
  cookingTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Quick 10-Min';
  calories: number;
  proteinGrams: number;
  description: string;
  ingredients: string[];
  steps: string[];
  preservationTip: string;
}

const SAMPLE_RECIPES: Record<string, Recipe> = {
  mango: {
    title: '🥭 Royal Chaunsa Mango Sourdough Shahi Tukda',
    cookingTimeMinutes: 12,
    difficulty: 'Quick 10-Min',
    calories: 290,
    proteinGrams: 7,
    description: 'A modern zero-waste twist on classic Pakistani dessert using surplus sourdough bread and ripe Chaunsa mango pulp.',
    ingredients: [
      '3 slices surplus Artisan Sourdough bread',
      '2 ripe Chaunsa Mangoes (pureed)',
      '1 cup Milk (or Olper’s Dairy)',
      '1 tbsp Ghee or Butter',
      'Pinch of Cardamom & chopped pistachios',
    ],
    steps: [
      'Toast sourdough slices in a pan with 1 tbsp ghee until golden and crisp (3 mins).',
      'Warm the milk with cardamom and drizzle 2 tablespoons over each crispy slice.',
      'Generously top with freshly blitzed ripe Chaunsa mango puree.',
      'Garnish with sliced pistachios and serve warm or chilled!',
    ],
    preservationTip: 'Freeze leftover ripe mango cubes on a flat baking tray for 2 hours, then store in ziplock bags for up to 6 months.',
  },
  bakery: {
    title: '🍕 Quick Tandoori Sourdough Naan Pizza',
    cookingTimeMinutes: 10,
    difficulty: 'Easy',
    calories: 340,
    proteinGrams: 16,
    description: 'Transform surplus bakery bread or naan into a gourmet personal tandoori pizza in 10 minutes.',
    ingredients: [
      '2 slices Sourdough or 1 Naan / Samosa combo surplus',
      '3 tbsp Garlic Chili Sauce or Pizza sauce',
      '1/2 cup Shredded Mozzarella / Cheddar',
      '1/2 Onion & Capsicum (diced)',
      'Sprinkle of Chaat Masala & Oregano',
    ],
    steps: [
      'Preheat a pan or toaster oven on medium heat.',
      'Spread garlic chili sauce evenly over the bread or naan base.',
      'Top with diced veggies and generous shredded cheese.',
      'Cover with a lid in a non-stick pan for 6-8 minutes until the cheese is bubbling.',
      'Dust with chaat masala and slice into hot triangles.',
    ],
    preservationTip: 'Store extra sourdough in a sealed bag with a paper towel; refrigerate up to 5 days or freeze slices individually.',
  },
  general: {
    title: '🍗 Gourmet Desi Fusion Surplus Stir-Fry & Rice',
    cookingTimeMinutes: 15,
    difficulty: 'Easy',
    calories: 420,
    proteinGrams: 28,
    description: 'High-protein, zero-waste family meal repurposing restaurant BBQ surplus and fresh produce.',
    ingredients: [
      'Rescued Chicken Tikka or Biryani portion',
      '1 cup Mixed Veggies (Onions, Tomatoes, Green Chilies)',
      '1 tbsp Soy sauce & 1 tsp Cumin powder',
      'Fresh Coriander leaves for garnish',
    ],
    steps: [
      'Shred the rescued BBQ chicken into bite-sized strips.',
      'Saute onions and tomatoes in a pan with a drop of oil and cumin (3 mins).',
      'Toss in the chicken and rice/veggies on high heat for 5 minutes.',
      'Drizzle with soy sauce and lime juice, garnish with coriander and serve steaming hot.',
    ],
    preservationTip: 'Cooked meat surplus can be vacuum sealed or placed in airtight glass containers for 3 days in the fridge.',
  },
};

export const FlashChefAiModal: React.FC<FlashChefAiModalProps> = ({
  isOpen,
  onClose,
  selectedDeal,
}) => {
  const [ingredients, setIngredients] = useState<string[]>([
    selectedDeal?.title || 'Chaunsa Mangoes',
    'Sourdough Bread',
    'Fresh Milk',
  ]);
  const [customInput, setCustomInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(SAMPLE_RECIPES.mango);
  const [cookingTimerActive, setCookingTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(12 * 60);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    if (!customInput.trim()) return;
    setIngredients((prev) => [...prev, customInput.trim()]);
    setCustomInput('');
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateRecipe = () => {
    setIsGenerating(true);
    sounds.playAlertPing();

    setTimeout(() => {
      setIsGenerating(false);
      sounds.playSuccessFanfare();

      const ingredientStr = ingredients.join(' ').toLowerCase();
      if (ingredientStr.includes('mango') || ingredientStr.includes('fruit')) {
        setActiveRecipe(SAMPLE_RECIPES.mango);
        setTimerSeconds(12 * 60);
      } else if (ingredientStr.includes('bread') || ingredientStr.includes('bakery') || ingredientStr.includes('sourdough')) {
        setActiveRecipe(SAMPLE_RECIPES.bakery);
        setTimerSeconds(10 * 60);
      } else {
        setActiveRecipe(SAMPLE_RECIPES.general);
        setTimerSeconds(15 * 60);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md flex-shrink-0 font-bold">
            <ChefHat className="size-6 text-[#85e3a8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">FlashChef AI™</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                Pakistani Recipe &amp; Preservation Engine
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Zero-waste culinary intelligence: transform surplus ingredients into delicious meals
            </p>
          </div>
        </div>

        {/* Ingredient Basket & Input */}
        <div className="p-4 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900/90 border border-[#e8e2d8] dark:border-stone-800 mb-6">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
            🛒 Rescued &amp; Pantry Ingredients in Your Kitchen:
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {ingredients.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 shadow-2xs"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  className="hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              placeholder="Add item (e.g. Greek yogurt, chicken, eggs)..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 font-medium focus:border-[#1b4332] focus:outline-none"
            />
            <button
              onClick={handleAddIngredient}
              className="px-3.5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Add</span>
            </button>
            <button
              onClick={handleGenerateRecipe}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="size-3.5 text-[#85e3a8]" />
              <span>{isGenerating ? 'Cooking AI...' : 'Generate Recipe 🍳'}</span>
            </button>
          </div>
        </div>

        {/* Recipe Display Card */}
        {activeRecipe && (
          <div className="p-6 rounded-3xl bg-[#fcfbf9] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex flex-col gap-5 shadow-sm">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white">{activeRecipe.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{activeRecipe.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#fff8e1] dark:bg-[#FF9800]/20 text-[#b78103] dark:text-[#FF9800] border border-[#ffecb3] dark:border-[#FF9800]/40 text-[11px] font-bold">
                  {activeRecipe.difficulty}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 text-[11px] font-bold">
                  ⏱️ {activeRecipe.cookingTimeMinutes} Mins
                </span>
              </div>
            </div>

            {/* Macros Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-[10px] text-stone-500 uppercase font-semibold block">Estimated Calories</span>
                <span className="font-black text-[#f37021] text-sm">{activeRecipe.calories} kcal</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-[10px] text-stone-500 uppercase font-semibold block">Protein Content</span>
                <span className="font-black text-[#2e7d32] dark:text-[#81c784] text-sm">{activeRecipe.proteinGrams}g Protein</span>
              </div>
            </div>

            {/* Ingredients Needed */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="size-3.5 text-[#f37021]" />
                Required Proportions:
              </h4>
              <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300 list-disc list-inside font-medium">
                {activeRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>

            {/* Step by Step Cooking Instructions */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#2e7d32]" />
                Step-by-Step Cooking Guide:
              </h4>
              <ol className="space-y-2 text-xs text-stone-700 dark:text-stone-200 font-medium">
                {activeRecipe.steps.map((st, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-[#f37021]">{i + 1}.</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Zero-Waste Shelf-Life Preservation Box */}
            <div className="p-3.5 rounded-2xl bg-[#edf7ed] dark:bg-[#1b4332]/25 border border-[#c8e6c9] dark:border-[#2e7d32]/40 text-xs flex items-start gap-2.5">
              <Snowflake className="size-5 text-[#2e7d32] dark:text-[#81c784] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#2e7d32] dark:text-[#81c784] block mb-0.5">Zero-Waste Shelf-Life Trick:</span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
                  {activeRecipe.preservationTip}
                </p>
              </div>
            </div>

            {/* Cooking Voice / Timer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#f37021]" />
                <span className="font-mono text-sm font-bold text-stone-900 dark:text-white">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={() => {
                  setCookingTimerActive(!cookingTimerActive);
                  sounds.playLaserBeep();
                }}
                className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Play className="size-3.5" />
                <span>{cookingTimerActive ? 'Pause Cooking Timer' : 'Start Step-by-Step Timer'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
