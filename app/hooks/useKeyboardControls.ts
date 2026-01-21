import { useState, useEffect } from 'react'
import { KeyboardControls } from '../types'

export function useKeyboardControls(): KeyboardControls {
  const [keys, setKeys] = useState<KeyboardControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    action: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys((prev) => ({ ...prev, forward: true }))
          break
        case 's':
        case 'arrowdown':
          setKeys((prev) => ({ ...prev, backward: true }))
          break
        case 'a':
        case 'arrowleft':
          setKeys((prev) => ({ ...prev, left: true }))
          break
        case 'd':
        case 'arrowright':
          setKeys((prev) => ({ ...prev, right: true }))
          break
        case ' ':
        case 'e':
          setKeys((prev) => ({ ...prev, action: true }))
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys((prev) => ({ ...prev, forward: false }))
          break
        case 's':
        case 'arrowdown':
          setKeys((prev) => ({ ...prev, backward: false }))
          break
        case 'a':
        case 'arrowleft':
          setKeys((prev) => ({ ...prev, left: false }))
          break
        case 'd':
        case 'arrowright':
          setKeys((prev) => ({ ...prev, right: false }))
          break
        case ' ':
        case 'e':
          setKeys((prev) => ({ ...prev, action: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keys
}

