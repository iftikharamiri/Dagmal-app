import { useState, useEffect } from 'react'
import { X, Filter, Check } from 'lucide-react'
import { norwegianText } from '@/i18n/no'
import { cn } from '@/lib/utils'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  cuisines: string[]
  dietary: string[]
  selectedCuisines: string[]
  selectedDietary: string[]
  priceRange?: [number, number]
  distance?: number
  sort?: 'nearest' | 'highest_discount' | 'lowest_price'
  onFiltersChange: (filters: {
    cuisines: string[]
    dietary: string[]
    priceRange?: [number, number]
    distance?: number
    sort?: 'nearest' | 'highest_discount' | 'lowest_price'
  }) => void
}

const sortOptions = [
  { value: 'nearest' as const, label: norwegianText.filters.nearest },
  { value: 'highest_discount' as const, label: norwegianText.filters.highestDiscount },
  { value: 'lowest_price' as const, label: norwegianText.filters.lowestPrice },
]

const distanceOptions = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
]

export function FilterSheet({
  isOpen,
  onClose,
  cuisines,
  dietary,
  selectedCuisines,
  selectedDietary,
  priceRange,
  distance,
  sort,
  onFiltersChange,
}: FilterSheetProps) {
  const [localCuisines, setLocalCuisines] = useState(selectedCuisines)
  const [localDietary, setLocalDietary] = useState(selectedDietary)
  const [localPriceRange, setLocalPriceRange] = useState(priceRange)
  const [localDistance, setLocalDistance] = useState(distance)
  const [localSort, setLocalSort] = useState(sort)

  useEffect(() => {
    if (isOpen) {
      setLocalCuisines(selectedCuisines)
      setLocalDietary(selectedDietary)
      setLocalPriceRange(priceRange)
      setLocalDistance(distance)
      setLocalSort(sort)
    }
  }, [isOpen, selectedCuisines, selectedDietary, priceRange, distance, sort])

  const handleApply = () => {
    onFiltersChange({
      cuisines: localCuisines,
      dietary: localDietary,
      priceRange: localPriceRange,
      distance: localDistance,
      sort: localSort,
    })
    onClose()
  }

  const handleClearAll = () => {
    setLocalCuisines([])
    setLocalDietary([])
    setLocalPriceRange(undefined)
    setLocalDistance(undefined)
    setLocalSort(undefined)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-card w-full max-w-md max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filtrer tilbud</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-full"
            aria-label={norwegianText.actions.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="p-4 space-y-6">
            {/* Sort */}
            <div>
              <h3 className="font-medium mb-3">{norwegianText.filters.sortBy}</h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalSort(option.value)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-2xl border transition-colors',
                      localSort === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <span>{option.label}</span>
                    {localSort === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <h3 className="font-medium mb-3">{norwegianText.filters.distance}</h3>
              <div className="grid grid-cols-2 gap-2">
                {distanceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalDistance(option.value)}
                    className={cn(
                      'flex items-center justify-center p-3 rounded-2xl border transition-colors',
                      localDistance === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisines */}
            {cuisines.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">{norwegianText.filters.cuisine}</h3>
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => {
                        setLocalCuisines(prev =>
                          prev.includes(cuisine)
                            ? prev.filter(c => c !== cuisine)
                            : [...prev, cuisine]
                        )
                      }}
                      className={cn(
                        'px-3 py-2 rounded-full border transition-colors text-sm',
                        localCuisines.includes(cuisine)
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary */}
            {dietary.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">{norwegianText.filters.dietary}</h3>
                <div className="flex flex-wrap gap-2">
                  {dietary.map((diet) => (
                    <button
                      key={diet}
                      onClick={() => {
                        setLocalDietary(prev =>
                          prev.includes(diet)
                            ? prev.filter(d => d !== diet)
                            : [...prev, diet]
                        )
                      }}
                      className={cn(
                        'px-3 py-2 rounded-full border transition-colors text-sm',
                        localDietary.includes(diet)
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">{norwegianText.filters.priceRange}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="Fra kr"
                    value={localPriceRange?.[0] || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      setLocalPriceRange(prev => [value || 0, prev?.[1] || 1000])
                    }}
                    className="input flex-1"
                  />
                  <span className="text-muted-fg">–</span>
                  <input
                    type="number"
                    placeholder="Til kr"
                    value={localPriceRange?.[1] || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      setLocalPriceRange(prev => [prev?.[0] || 0, value || 1000])
                    }}
                    className="input flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex gap-3">
            <button
              onClick={handleClearAll}
              className="btn-ghost flex-1"
            >
              Nullstill
            </button>
            <button
              onClick={handleApply}
              className="btn-primary flex-1"
            >
              Bruk filtere
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
































