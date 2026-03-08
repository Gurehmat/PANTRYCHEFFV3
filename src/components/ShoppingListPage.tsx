import { useEffect, useState, useCallback, memo, type FormEvent } from 'react';
import { useShoppingListStore } from '../store/shoppingListStore';
import { usePantryStore } from '../store/pantryStore';
import { Plus, Trash2, CheckCircle, Circle, ShoppingCart, Package } from 'lucide-react';
import type { ShoppingListItem } from '../types/database';

/** Memoized because parent re-renders on store updates (e.g. add/toggle another item) but this row only needs to re-render when its own item or handlers change. */
const ShoppingListItemRow = memo(function ShoppingListItemRow({
  item,
  onToggle,
  onDelete,
  onAddToPantry,
}: {
  item: ShoppingListItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onAddToPantry: (item: ShoppingListItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 group p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={`flex-shrink-0 transition-colors ${item.checked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
      >
        {item.checked ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </button>
      <span
        className={`flex-1 font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
      >
        {item.name}
      </span>
      <button
        type="button"
        onClick={() => onAddToPantry(item)}
        className="text-gray-300 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all p-2"
        title="Move to pantry"
      >
        <Package className="w-5 h-5" />
      </button>
      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
});

export default function ShoppingListPage() {
  const { items, fetchItems, addItem, toggleItem, deleteItem, loading } = useShoppingListStore();
  const addPantryItem = usePantryStore((state) => state.addItem);
  const [newItemName, setNewItemName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem({ name: newItemName.trim(), quantity: 1, unit: 'pc' });
    setNewItemName('');
  };

  const handleToggle = useCallback(
    (id: string, checked: boolean) => {
      toggleItem(id, checked);
    },
    [toggleItem]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteItem(id);
    },
    [deleteItem]
  );

  const handleAddToPantry = useCallback(
    async (item: ShoppingListItem) => {
      const result = await addPantryItem({
        name: item.name,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? 'pc',
      });
      if (result.success) {
        await deleteItem(item.id);
        setToast(`Added ${item.name} to pantry ✓`);
        window.setTimeout(() => setToast(null), 3000);
      } else {
        setToast(`Could not add "${item.name}" to pantry.`);
        window.setTimeout(() => setToast(null), 4000);
      }
    },
    [addPantryItem, deleteItem]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          Shopping List
        </h1>
        {toast && (
          <div className="mb-4 text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-100">
            {toast}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add item (e.g. Milk)"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </form>
        <div className="space-y-4">
          {loading && items.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="h-5 flex-1 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-700">No items in your shopping list</p>
              <p className="text-sm mt-1">Add items above or add from recipes.</p>
            </div>
          )}
          {items.length > 0 &&
            items.map((item) => (
              <ShoppingListItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onAddToPantry={handleAddToPantry}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
