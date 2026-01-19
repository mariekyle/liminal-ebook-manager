/**
 * CollectionGradient - Deterministic gradient generation for collections
 * 
 * Features:
 * - 3 expressive gradient styles (Layered Mist, Drift Bloom, Veiled Depth)
 * - 2-3 colors per gradient (simpler than book gradients)
 * - Deterministic based on collection name + ID
 * - Uses same color palette as book gradients
 */

import { useMemo } from 'react'

// Book gradient color lanes (same palette as books)
const COLOR_LANES = {
  lane0: '#FF6B6B', // Red
  lane1: '#4ECDC4', // Teal  
  lane2: '#45B7D1', // Blue
  lane3: '#FFA07A', // Coral
  lane4: '#98D8C8', // Mint
  lane5: '#F7DC6F', // Yellow
  lane6: '#BB8FCE', // Purple
  lane7: '#85C1E2', // Sky
  lane8: '#F8B195', // Peach
  lane9: '#C06C84', // Rose
}

// Hash string to number (same algorithm as books)
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Helper: Mix two colors for smoother transitions
function mixColors(color1, color2, ratio = 50) {
  return `color-mix(in srgb, ${color1} ${ratio}%, ${color2} ${100 - ratio}%)`
}

/**
 * Generate CSS gradient based on style index
 * 
 * @param {number} styleIndex - 0, 1, or 2 (3 styles)
 * @param {string[]} colors - Array of 2-3 color values
 * @param {number} rotation - Angle in degrees
 */
function generateGradientStyle(styleIndex, colors, rotation) {
  const [c1, c2, c3] = colors
  const hasThreeColors = colors.length === 3
  
  switch (styleIndex) {
    case 0: // Layered Mist - soft atmospheric layers
      if (hasThreeColors) {
        // Softer 3-color blend with intermediate steps
        return {
          background: `
            linear-gradient(${rotation}deg,
              ${c1} 0%,
              ${mixColors(c1, c2, 70)} 25%,
              ${mixColors(c1, c2, 40)} 50%,
              ${mixColors(c2, c3, 60)} 75%,
              ${c3} 100%
            ),
            linear-gradient(20deg, rgba(255,255,255,0.25), rgba(0,0,0,0))
          `,
          backgroundBlendMode: 'soft-light'
        }
      } else {
        // Simple 2-color gradient
        return {
          background: `
            linear-gradient(${rotation}deg,
              ${c1} 0%,
              ${c2} 100%
            ),
            linear-gradient(20deg, rgba(255,255,255,0.25), rgba(0,0,0,0))
          `,
          backgroundBlendMode: 'soft-light'
        }
      }
      
    case 1: // Drift Bloom - organic radial overlaps
      if (hasThreeColors) {
        // 3 radial circles + base gradient
        return {
          background: `
            radial-gradient(circle at 20% 30%, ${c1}, transparent 55%),
            radial-gradient(circle at 80% 20%, ${c2}, transparent 50%),
            radial-gradient(circle at 50% 80%, ${c3}, transparent 60%),
            linear-gradient(180deg, ${c2}, ${c3})
          `
        }
      } else {
        // 2 radial circles + base gradient
        return {
          background: `
            radial-gradient(circle at 20% 30%, ${c1}, transparent 55%),
            radial-gradient(circle at 80% 70%, ${c2}, transparent 60%),
            linear-gradient(180deg, ${c1}, ${c2})
          `
        }
      }
      
    case 2: // Veiled Depth - subtle depth with texture
      if (hasThreeColors) {
        // 3-color gradient with depth overlays
        return {
          background: `
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.35), transparent 60%),
            radial-gradient(circle at 60% 70%, rgba(0,0,0,0.25), transparent 65%),
            linear-gradient(${rotation}deg,
              ${c1},
              ${c2},
              ${c3}
            )
          `,
          backgroundBlendMode: 'overlay'
        }
      } else {
        // 2-color gradient with depth overlays
        return {
          background: `
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.35), transparent 60%),
            radial-gradient(circle at 60% 70%, rgba(0,0,0,0.25), transparent 65%),
            linear-gradient(${rotation}deg,
              ${c1},
              ${c2}
            )
          `,
          backgroundBlendMode: 'overlay'
        }
      }
      
    default:
      // Fallback: simple linear gradient
      return { 
        background: `linear-gradient(135deg, ${c1}, ${c2})` 
      }
  }
}

/**
 * CollectionGradient Component
 * 
 * Generates a deterministic gradient cover for collections without custom images.
 * Same collection name + ID always produces the same gradient.
 */
export default function CollectionGradient({ 
  collectionId, 
  collectionName, 
  className = '' 
}) {
  const gradient = useMemo(() => {
    const seed = hashString(`${collectionName}-${collectionId}`)
    
    // Pick gradient style (0-2 for 3 styles)
    const styleIndex = seed % 3
    
    // Pick 2-3 colors from palette
    const numColors = 2 + (seed % 2) // 2 or 3 colors
    const colorIndices = []
    for (let i = 0; i < numColors; i++) {
      const colorIndex = (seed + i * 7) % 10 // Use offset to vary colors
      colorIndices.push(`lane${colorIndex}`)
    }
    const colors = colorIndices.map(key => COLOR_LANES[key])
    
    // Pick rotation angle
    const rotation = seed % 360
    
    return generateGradientStyle(styleIndex, colors, rotation)
  }, [collectionId, collectionName])
  
  return (
    <div 
      className={`w-full h-full ${className}`}
      style={gradient}
    />
  )
}
