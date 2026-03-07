import { useState, type FormEvent } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { usePantryStore } from '../store/pantryStore';

interface FormData {
  name: string;
  quantity: string;
  unit: string;
  expiry_date: string;
}

export default function AddItemForm() {
  const addItem = usePantryStore((state) => state.addItem);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    quantity: '',
    unit: 'pcs',
    expiry_date: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name) return;
    setLoading(true);
    await addItem({
      ...formData,
      quantity: Number(formData.quantity) || 1,
      expiry_date: formData.expiry_date || null,
    });
    setFormData({ name: '', quantity: '', unit: 'pcs', expiry_date: '' });
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-orange-500" />
        Add New Item
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
          <input
            type="text"
            id="add-pantry-item-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Avocados"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="1"
              min={0}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="pcs">Pieces</option>
              <option value="kg">Kg</option>
              <option value="g">Grams</option>
              <option value="lb">Lb</option>
              <option value="oz">Oz</option>
              <option value="l">Liters</option>
              <option value="ml">ml</option>
              <option value="cup">Cup</option>
              <option value="tbsp">Tbsp</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Pantry'}
        </button>
      </form>
    </div>
  );
}
