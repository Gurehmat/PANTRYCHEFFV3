import { useEffect, useState } from 'react'
import { useShoppingListStore } from '../store/shoppingListStore'
import { Plus, Trash2, CheckCircle, Circle, ShoppingCart, Loader2 } from 'lucide-react'

export default function ShoppingListPage() {
    const { items, fetchItems, addItem, toggleItem, deleteItem, loading } = useShoppingListStore()
    const [newItemName, setNewItemName] = useState('')

    useEffect(() => {
        fetchItems()
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newItemName.trim()) return

        await addItem({
            name: newItemName,
            quantity: 1,
            unit: 'pc'
        })
        setNewItemName('')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-orange-500" />
                    Shopping List
                </h1>

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
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-orange-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="font-medium text-gray-600">Loading shopping list...</p>
                        </div>
                    )}
                    {items.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-400">
                            Your list is empty. Time to plan a meal?
                        </div>
                    )}

                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <button
                                onClick={() => toggleItem(item.id, !item.checked)}
                                className={`flex-shrink-0 transition-colors ${item.checked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                            >
                                {item.checked ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>

                            <span className={`flex-1 font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {item.name}
                            </span>

                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
