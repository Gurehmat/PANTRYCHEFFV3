import { useState, useEffect } from 'react'
import { Trash2, Calendar, Package, Pencil } from 'lucide-react'
import { usePantryStore } from '../store/pantryStore'

export default function PantryList() {
    const { pantryItems, fetchPantry, deleteItem, updateItem, loading } = usePantryStore()
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', quantity: '', unit: '', expiry_date: '' })
    const [updateLoading, setUpdateLoading] = useState(false)

    useEffect(() => {
        fetchPantry()
    }, [])

    const startEditing = (item) => {
        setEditingId(item.id)
        setEditForm({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            expiry_date: item.expiry_date || ''
        })
    }

    const handleUpdate = async (id) => {
        setUpdateLoading(true)
        const updates = {
            name: editForm.name,
            quantity: parseFloat(editForm.quantity) || 0,
            unit: editForm.unit,
            expiry_date: editForm.expiry_date || null
        }
        await updateItem(id, updates)
        setUpdateLoading(false)
        setEditingId(null)
    }

    if (loading && pantryItems.length === 0) {
        return <div className="text-center py-10 text-gray-500">Loading pantry...</div>
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
                <Package className="w-5 h-5 text-orange-500" />
                Current Pantry
                <span className="text-sm font-normal text-gray-500 ml-auto">
                    {pantryItems.length} items
                </span>
            </h2>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {pantryItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p>Your pantry is empty.</p>
                        <p className="text-sm">Add some items to get started!</p>
                    </div>
                ) : (
                    pantryItems.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all"
                        >
                            {editingId === item.id ? (
                                <div className="flex-1 mr-2 grid gap-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="flex-1 px-2 py-1 border rounded text-sm"
                                            placeholder="Item name"
                                        />
                                        <input
                                            type="number"
                                            value={editForm.quantity}
                                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            placeholder="Qty"
                                        />
                                        <input
                                            type="text"
                                            value={editForm.unit}
                                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            placeholder="Unit"
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={editForm.expiry_date}
                                        onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                                        className="w-full px-2 py-1 border rounded text-sm text-gray-500"
                                    />
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => handleUpdate(item.id)}
                                            disabled={updateLoading}
                                            className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200"
                                        >
                                            {updateLoading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
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
                                {!editingId && (
                                    <button
                                        onClick={() => startEditing(item)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit item"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteItem(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
