import AddItemForm from './AddItemForm'
import PantryList from './PantryList'
import PantryScanner from './PantryScanner'

export default function PantryPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 space-y-6">
                    <PantryScanner />
                    <AddItemForm />
                </div>
                <div className="md:w-2/3 md:h-[calc(100vh-8rem)] min-h-[500px]">
                    <PantryList />
                </div>
            </div>
        </div>
    )
}
