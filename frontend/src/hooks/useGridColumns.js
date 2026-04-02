import { useState, useEffect, useMemo } from 'react'
import { getSettings } from '../api'

/**
 * Shared hook for grid column preference from Settings.
 * Reads the grid_columns setting on mount, listens for live changes
 * via the settingsChanged custom event from SettingsDrawer.
 *
 * Returns:
 *   gridColumns — raw setting value ('2', '3', or '4')
 *   gridClasses — ready-to-use Tailwind grid classes string
 *
 * Usage:
 *   const { gridClasses } = useGridColumns()
 *   <div className={gridClasses}>{cards}</div>
 */
export function useGridColumns() {
  const [gridColumns, setGridColumns] = useState('3')

  // Load from API on mount
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.grid_columns) {
          setGridColumns(settings.grid_columns)
        }
      })
      .catch(err => console.error('useGridColumns: failed to load settings:', err))
  }, [])

  // Listen for live changes from SettingsDrawer
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail.grid_columns !== undefined) {
        setGridColumns(String(event.detail.grid_columns))
      }
    }
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Build Tailwind grid classes: mobile uses setting, desktop expands
  const gridClasses = useMemo(() => {
    const mobileColsMap = {
      '2': 'grid-cols-2',
      '3': 'grid-cols-3',
      '4': 'grid-cols-4'
    }
    const mobileCols = mobileColsMap[gridColumns] || 'grid-cols-3'
    return `grid ${mobileCols} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`
  }, [gridColumns])

  return { gridColumns, gridClasses }
}

