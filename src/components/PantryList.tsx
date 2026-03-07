import { useState, useEffect, useCallback, memo, type Dispatch, type SetStateAction } from 'react';
import { Trash2, Calendar, Package, Pencil } from 'lucide-react';
import { usePantryStore } from '../store/pantryStore';
import ExpiryBanner from './common/ExpiryBanner';
import type { PantryItem } from '../types/database';

interface EditForm {
  name: string;
  quantity: string;
  unit: string;
  expiry_date: string;
}

/** Memoized because parent re-renders on store updates (e.g. add/update another item) but this row only needs to re-render when its own item or editing state changes. */
const PantryItemRow = memo(function PantryItemRow({
  item,
  isEditing,
  editForm,
  updateLoading,
  onStartEdit,
  onUpdate,
  onCancel,
  onDelete,
  setEditForm,
}: {
  item: PantryItem;
  isEditing: boolean;
  editForm: EditForm;
  updateLoading: boolean;
  onStartEdit: (item: PantryItem) => void;
  onUpdate: (id: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  setEditForm: Dispatch<SetStateAction<EditForm>>;
}) {
  return (
    <div className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all">
      {isEditing ? (
        <div className="flex-1 mr-2 grid gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 px-2 py-1 border rounded text-sm"
              placeholder="Item name"
            />
            <input
              type="number"
              value={editForm.quantity}
              onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-16 px-2 py-1 border rounded text-sm"
              placeholder="Qty"
            />
            <input
              type="text"
              value={editForm.unit}
              onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
              className="w-16 px-2 py-1 border rounded text-sm"
              placeholder="Unit"
            />
          </div>
          <input
            type="date"
            value={editForm.expiry_date}
            onChange={(e) => setEditForm((f) => ({ ...f, expiry_date: e.target.value }))}
            className="w-full px-2 py-1 border rounded text-sm text-gray-500"
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => onUpdate(item.id)}
              disabled={updateLoading}
              className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200"
            >
              {updateLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-600">
              {item.quantity} {item.unit}
            </span>
            {item.expiry_date && (
              <span className="flex items-center gap-1 text-orange-600/80">
                <Calendar className="w-3 h-3" />
                Expires: {new Date(item.expiry_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {!isEditing && (
          <button
            onClick={() => onStartEdit(item)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit item"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default function PantryList() {
  const { pantryItems, fetchPantry, deleteItem, updateItem, loading } = usePantryStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    quantity: '',
    unit: '',
    expiry_date: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchPantry();
  }, [fetchPantry]);

  const startEditing = useCallback((item: PantryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      expiry_date: item.expiry_date || '',
    });
  }, []);

  const handleUpdate = useCallback(
    async (id: string) => {
      setUpdateLoading(true);
      const updates = {
        name: editForm.name,
        quantity: parseFloat(editForm.quantity) || 0,
        unit: editForm.unit,
        expiry_date: editForm.expiry_date || null,
      };
      await updateItem(id, updates);
      setUpdateLoading(false);
      setEditingId(null);
    },
    [editForm, updateItem]
  );

  const handleCancel = useCallback(() => setEditingId(null), []);

  const handleDelete = useCallback((id: string) => deleteItem(id), [deleteItem]);

  if (loading && pantryItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-100 flex items-center gap-3">
              <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <ExpiryBanner items={pantryItems} />
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
        <Package className="w-5 h-5 text-orange-500" />
        Current Pantry
        <span className="text-sm font-normal text-gray-500 ml-auto">
          {pantryItems.length} items
        </span>
      </h2>
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {pantryItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Your pantry is empty</p>
            <p className="text-sm text-gray-500 mt-1">Add some items to get started!</p>
            <button
              type="button"
              onClick={() =>
                document.querySelector<HTMLInputElement>('input[placeholder*="Add"]')?.focus()
              }
              className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Package className="w-4 h-4" />
              Add your first item
            </button>
          </div>
        ) : (
          pantryItems.map((item) => (
            <PantryItemRow
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editForm={editForm}
              updateLoading={updateLoading}
              onStartEdit={startEditing}
              onUpdate={handleUpdate}
              onCancel={handleCancel}
              onDelete={handleDelete}
              setEditForm={setEditForm}
            />
          ))
        )}
      </div>
    </div>
  );
}
