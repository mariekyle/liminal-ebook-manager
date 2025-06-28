import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>📚 Liminal Ebook Manager</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/book/:id" element={<BookDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App 