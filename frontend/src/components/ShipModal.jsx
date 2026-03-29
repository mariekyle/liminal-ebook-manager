import { useState, useEffect } from 'react'
import { listShips } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import SearchInput from './ui/SearchInput'
import { sortStringsByRelevance } from '../utils/searchSort'

function ShipModal({ isOpen, onClose, selectedShip, onApply }) {
  const [ships, setShips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState(selectedShip)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setLocalSelected(selectedShip)

    listShips()
      .then((items) => {
        setShips(items)
      })
      .catch((err) => {
        console.error('Failed to load ships:', err)
        setShips([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, selectedShip])

  const filtered = ships.filter((ship) => ship.toLowerCase().includes(search.toLowerCase()))
  const displayShips = sortStringsByRelevance(filtered, search)

  const handleApply = () => {
    onApply(localSelected)
    onClose()
  }

  const handleClear = () => {
    setLocalSelected('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose}>Filter by Ship</Modal.Header>
      <Modal.Body className="flex flex-col min-h-0 gap-0 p-0">
        <div className="px-5 pt-2 pb-4 border-b border-border-default flex-shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search ships..." autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8 text-text-secondary text-body-sm">Loading ships...</div>
          ) : displayShips.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-body-sm">
              {search ? 'No matching ships' : 'No ships found'}
            </div>
          ) : (
            <div className="space-y-1">
              {displayShips.map((ship) => (
                <button
                  key={ship}
                  type="button"
                  onClick={() => setLocalSelected(ship)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-out text-left min-h-[44px] ${
                    localSelected === ship
                      ? 'bg-action-primary/15 text-text-primary'
                      : 'hover:bg-bg-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      localSelected === ship ? 'border-action-primary' : 'border-border-default'
                    }`}
                  >
                    {localSelected === ship && (
                      <div className="w-2.5 h-2.5 rounded-full bg-action-primary" />
                    )}
                  </div>
                  <span className="flex-1 truncate text-body-sm">{ship}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" variant="primary" onClick={handleApply}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShipModal
