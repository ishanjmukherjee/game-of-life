import { useState, useEffect, useCallback } from 'react'
import './App.css'

const CELL_SIZE = 20
const INITIAL_DENSITY = 0.25
const TICK_INTERVAL = 100 // ms between generations

function App() {
  // Calculate grid dimensions from window size (ceil to ensure full coverage)
  const [dimensions, setDimensions] = useState(() => ({
    cols: Math.ceil(window.innerWidth / CELL_SIZE),
    rows: Math.ceil(window.innerHeight / CELL_SIZE),
  }))

  // Create empty grid
  const createEmptyGrid = useCallback((rows: number, cols: number) => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    )
  }, [])

  // Create random grid
  const createRandomGrid = useCallback((rows: number, cols: number) => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() < INITIAL_DENSITY)
    )
  }, [])

  const [grid, setGrid] = useState(() =>
    createEmptyGrid(dimensions.rows, dimensions.cols)
  )
  const [running, setRunning] = useState(false)

  // Track mouse state for painting
  const [isPainting, setIsPainting] = useState(false)

  // Check if grid is empty
  const isGridEmpty = useCallback((grid: boolean[][]) => {
    return grid.every((row) => row.every((cell) => !cell))
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newCols = Math.ceil(window.innerWidth / CELL_SIZE)
      const newRows = Math.ceil(window.innerHeight / CELL_SIZE)
      setDimensions({ cols: newCols, rows: newRows })
      setGrid(createEmptyGrid(newRows, newCols))
      setRunning(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [createEmptyGrid])

  // Count live neighbors with wrapping
  const countNeighbors = useCallback(
    (grid: boolean[][], row: number, col: number) => {
      const rows = grid.length
      const cols = grid[0].length
      let count = 0

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue
          const newRow = (row + i + rows) % rows
          const newCol = (col + j + cols) % cols
          if (grid[newRow][newCol]) count++
        }
      }
      return count
    },
    []
  )

  // Compute next generation
  const nextGeneration = useCallback(() => {
    setGrid((currentGrid) => {
      return currentGrid.map((row, i) =>
        row.map((cell, j) => {
          const neighbors = countNeighbors(currentGrid, i, j)
          // Conway's rules:
          // 1. Live cell with 2-3 neighbors survives
          // 2. Dead cell with exactly 3 neighbors becomes alive
          // 3. All other cells die or stay dead
          if (cell) {
            return neighbors === 2 || neighbors === 3
          } else {
            return neighbors === 3
          }
        })
      )
    })
  }, [countNeighbors])

  // Run simulation
  useEffect(() => {
    if (!running) return

    const interval = setInterval(nextGeneration, TICK_INTERVAL)

    return () => clearInterval(interval)
  }, [running, nextGeneration])

  // Set cell alive (for painting)
  const setCellAlive = (row: number, col: number) => {
    setGrid((currentGrid) => {
      if (currentGrid[row][col]) return currentGrid // Already alive
      const newGrid = currentGrid.map((r) => [...r])
      newGrid[row][col] = true
      return newGrid
    })
  }

  // Start simulation (populate randomly if empty)
  const start = () => {
    if (isGridEmpty(grid)) {
      setGrid(createRandomGrid(dimensions.rows, dimensions.cols))
    }
    setRunning(true)
  }

  // Clear grid
  const clear = () => {
    setRunning(false)
    setGrid(createEmptyGrid(dimensions.rows, dimensions.cols))
  }

  return (
    <div className="container">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${dimensions.cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${dimensions.rows}, ${CELL_SIZE}px)`,
        }}
        onMouseDown={() => setIsPainting(true)}
        onMouseUp={() => setIsPainting(false)}
        onMouseLeave={() => setIsPainting(false)}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`cell ${cell ? 'alive' : ''}`}
              onMouseDown={() => setCellAlive(i, j)}
              onMouseEnter={() => isPainting && setCellAlive(i, j)}
            />
          ))
        )}
      </div>
      <div className="controls">
        <button onClick={running ? () => setRunning(false) : start}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={nextGeneration} disabled={running}>
          Step
        </button>
        <button onClick={clear}>Clear</button>
      </div>
    </div>
  )
}

export default App
