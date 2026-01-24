// ============================================================================
// Voronoi Relaxation (Lloyd's Algorithm)
// Uses d3-delaunay for proper Voronoi diagram computation
// ============================================================================

import { Delaunay } from 'd3-delaunay';

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

/**
 * Generate random points within bounds
 */
function generateRandomPoints(count: number, bounds: Bounds): Point[] {
  const points: Point[] = [];
  
  for (let i = 0; i < count; i++) {
    points.push({
      x: bounds.x + Math.random() * bounds.width,
      y: bounds.y + Math.random() * bounds.height,
    });
  }
  
  return points;
}

/**
 * Calculate the centroid of a polygon
 */
function calculatePolygonCentroid(polygon: number[][]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[j];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  
  area *= 0.5;
  
  // Handle degenerate cases
  if (Math.abs(area) < 1e-10) {
    // Fall back to simple average
    let sumX = 0;
    let sumY = 0;
    for (const [x, y] of polygon) {
      sumX += x;
      sumY += y;
    }
    return {
      x: sumX / polygon.length,
      y: sumY / polygon.length,
    };
  }
  
  return {
    x: cx / (6 * area),
    y: cy / (6 * area),
  };
}

/**
 * Clamp a point to stay within bounds
 */
function clampToBounds(point: Point, bounds: Bounds): Point {
  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, point.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, point.y)),
  };
}

/**
 * Apply one iteration of Lloyd's relaxation
 * Moves each point to the centroid of its Voronoi cell
 */
function lloydIteration(points: Point[], bounds: Bounds): Point[] {
  if (points.length === 0) return points;
  if (points.length === 1) return [clampToBounds(points[0], bounds)];
  
  // Convert points to flat array format for d3-delaunay
  const flatPoints: [number, number][] = points.map(p => [p.x, p.y]);
  
  // Create Delaunay triangulation
  const delaunay = Delaunay.from(flatPoints);
  
  // Create Voronoi diagram with bounds
  const voronoi = delaunay.voronoi([
    bounds.x,
    bounds.y,
    bounds.x + bounds.width,
    bounds.y + bounds.height,
  ]);
  
  // Move each point to the centroid of its Voronoi cell
  const newPoints: Point[] = [];
  
  for (let i = 0; i < points.length; i++) {
    // Get the polygon vertices for this cell
    const cell = voronoi.cellPolygon(i);
    
    if (cell && cell.length > 0) {
      // Calculate centroid of the Voronoi cell
      const centroid = calculatePolygonCentroid(cell);
      
      // Clamp to bounds to prevent drift
      newPoints.push(clampToBounds(centroid, bounds));
    } else {
      // If no cell (shouldn't happen), keep original point
      newPoints.push(clampToBounds(points[i], bounds));
    }
  }
  
  return newPoints;
}

/**
 * Generate evenly-distributed points using Voronoi relaxation (Lloyd's algorithm)
 * 
 * @param count - Number of points to generate
 * @param bounds - Bounding box for point generation
 * @param iterations - Number of relaxation iterations (default: 4)
 * @returns Array of relaxed points
 */
export function generateRelaxedPoints(
  count: number,
  bounds: Bounds,
  iterations: number = 4
): Point[] {
  if (count <= 0) return [];
  
  // Start with random points
  let points = generateRandomPoints(count, bounds);
  
  // Apply Lloyd's relaxation for the specified number of iterations
  for (let i = 0; i < iterations; i++) {
    points = lloydIteration(points, bounds);
  }
  
  return points;
}
