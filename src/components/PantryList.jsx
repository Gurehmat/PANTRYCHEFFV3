import { useEffect } from 'react'
import { Trash2, Calendar, Package } from 'lucide-react'
import { usePantryStore } from '../store/pantryStore'

export default function PantryList() {
    const { pantryItems, fetchPantry, deleteItem, loading } = usePantryStore()

    useEffect(() => {
        fetchPantry()
    }, [])

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

                            <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
