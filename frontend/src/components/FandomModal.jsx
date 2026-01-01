import { useState, useEffect } from 'react'
import { listFandoms } from '../api'

function FandomModal({ isOpen, onClose, selectedFandom, onApply }) {
  const [fandoms, setFandoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState(selectedFandom)

  // Load fandoms when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    setLoading(true)
    setLocalSelected(selectedFandom)
    
    listFandoms()
      .then(items => {
        setFandoms(items)
      })
      .catch(err => {
        console.error('Failed to load fandoms:', err)
        setFandoms([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, selectedFandom])

  if (!isOpen) return null

  // Filter fandoms by search
  const filteredFandoms = fandoms.filter(fandom =>
    fandom.toLowerCase().includes(search.toLowerCase())
  )

  const handleApply = () => {
    onApply(localSelected)
    onClose()
  }

  const handleClear = () => {
    setLocalSelected('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-library-card rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Filter by Fandom</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search fandoms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
          />
        </div>
        
        {/* Fandom List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading fandoms...
            </div>
          ) : filteredFandoms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {search ? 'No matching fandoms' : 'No fandoms found'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFandoms.map(fandom => (
                <button
                  key={fandom}
                  onClick={() => setLocalSelected(fandom)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    localSelected === fandom
                      ? 'bg-library-accent/20 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    localSelected === fandom
                      ? 'border-library-accent'
                      : 'border-gray-500'
                  }`}>
                    {localSelected === fandom && (
                      <div className="w-2.5 h-2.5 rounded-full bg-library-accent" />
                    )}
                  </div>
                  
                  {/* Fandom name */}
                  <span className="flex-1 truncate">
                    {fandom}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="bg-library-accent text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default FandomModal

