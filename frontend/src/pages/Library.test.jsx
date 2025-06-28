import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Library from './Library'

// Mock the fetch function
global.fetch = jest.fn()

// Wrap component with router for testing
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Library Component', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  test('renders loading state initially', () => {
    fetch.mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )
    
    renderWithRouter(<Library />)
    expect(screen.getByText('Loading your library...')).toBeInTheDocument()
  })

  test('renders empty state when no books', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )
    
    renderWithRouter(<Library />)
    
    // Wait for the empty state to appear
    const emptyState = await screen.findByText('No books found')
    expect(emptyState).toBeInTheDocument()
    expect(screen.getByText('Upload your first EPUB file to get started!')).toBeInTheDocument()
  })

  test('renders upload button', () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )
    
    renderWithRouter(<Library />)
    expect(screen.getByText('📤 Upload EPUB')).toBeInTheDocument()
  })

  test('renders search input', () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )
    
    renderWithRouter(<Library />)
    expect(screen.getByPlaceholderText('Search books by title or author...')).toBeInTheDocument()
  })
}) 