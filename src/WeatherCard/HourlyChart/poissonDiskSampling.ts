// ============================================================================
// Fast Poisson Disk Sampling (Bridson's Algorithm)
// Generates evenly-distributed points with guaranteed minimum spacing
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Grid-based spatial structure for fast neighbor lookups
// ============================================================================

class SpatialGrid {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private grid: (Point | null)[][];
  private offsetX: number;
  private offsetY: number;

  constructor(bounds: Bounds, cellSize: number) {
    this.cellSize = cellSize;
    this.offsetX = bounds.x;
    this.offsetY = bounds.y;
    this.cols = Math.ceil(bounds.width / cellSize);
    this.rows = Math.ceil(bounds.height / cellSize);
    
    // Initialize empty grid
    this.grid = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(null)
    );
  }

  /**
   * Get grid cell coordinates for a point
   */
  private getCell(x: number, y: number): [number, number] {
    const col = Math.floor((x - this.offsetX) / this.cellSize);
    const row = Math.floor((y - this.offsetY) / this.cellSize);
    return [row, col];
  }

  /**
   * Insert a point into the grid
   */
  insert(point: Point): void {
    const [row, col] = this.getCell(point.x, point.y);
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.grid[row][col] = point;
    }
  }

  /**
   * Check if a point is valid (minimum distance from all neighbors)
   */
  isValid(point: Point, minDistance: number): boolean {
    const [row, col] = this.getCell(point.x, point.y);
    
    // Check surrounding cells (2 cells in each direction to be safe)
    const searchRadius = 2;
    for (let r = row - searchRadius; r <= row + searchRadius; r++) {
      for (let c = col - searchRadius; c <= col + searchRadius; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        
        const neighbor = this.grid[r][c];
        if (!neighbor) continue;
        
        const dx = point.x - neighbor.x;
        const dy = point.y - neighbor.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < minDistance * minDistance) {
          return false;
        }
      }
    }
    
    return true;
  }
}

// ============================================================================
// Poisson Disk Sampling Algorithm
// ============================================================================

/**
 * Generate evenly-distributed points using Fast Poisson Disk Sampling
 * 
 * @param count - Target number of points (approximate)
 * @param bounds - Bounding box for point generation
 * @param minDistance - Optional minimum distance between points
 * @param maxAttempts - Maximum attempts per point (default: 30)
 */
export function generatePoissonPoints(
  count: number,
  bounds: Bounds,
  minDistance?: number,
  maxAttempts: number = 30
): Point[] {
  if (count <= 0) return [];
  
  // Calculate minimum distance based on density if not provided
  if (!minDistance) {
    const area = bounds.width * bounds.height;
    const density = count / area;
    // Use sqrt to get approximate spacing, with safety factor of 0.8
    minDistance = Math.sqrt(1 / density) * 0.8;
  }
  
  // Initialize spatial grid (cell size = minDistance / √2 for optimal coverage)
  const cellSize = minDistance / Math.sqrt(2);
  const grid = new SpatialGrid(bounds, cellSize);
  
  const points: Point[] = [];
  const activeList: Point[] = [];
  
  // Start with one random point
  const firstPoint: Point = {
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
  };
  
  points.push(firstPoint);
  activeList.push(firstPoint);
  grid.insert(firstPoint);
  
  // Generate points until we reach target count or run out of active points
  while (activeList.length > 0 && points.length < count * 2) {
    // Pick a random active point
    const activeIndex = Math.floor(Math.random() * activeList.length);
    const activePoint = activeList[activeIndex];
    
    let found = false;
    
    // Try to generate a new point around it
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate candidate point in annulus between minDistance and 2*minDistance
      const angle = Math.random() * 2 * Math.PI;
      const radius = minDistance + Math.random() * minDistance;
      
      const candidate: Point = {
        x: activePoint.x + radius * Math.cos(angle),
        y: activePoint.y + radius * Math.sin(angle),
      };
      
      // Check if candidate is within bounds
      if (
        candidate.x < bounds.x || 
        candidate.x >= bounds.x + bounds.width ||
        candidate.y < bounds.y || 
        candidate.y >= bounds.y + bounds.height
      ) {
        continue;
      }
      
      // Check if candidate is valid (minimum distance from neighbors)
      if (grid.isValid(candidate, minDistance)) {
        points.push(candidate);
        activeList.push(candidate);
        grid.insert(candidate);
        found = true;
        break;
      }
    }
    
    // If no valid point found after maxAttempts, remove from active list
    if (!found) {
      activeList.splice(activeIndex, 1);
    }
  }
  
  // Return exactly the requested count (or all if we couldn't generate enough)
  return points.slice(0, count);
}
