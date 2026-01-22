// ============================================================================
// Weather SVG Elements
// Reusable SVG components for weather visualization
// ============================================================================

import type { JSX } from 'preact';
import type { Season } from './weatherUtils';

// ============================================================================
// Cloud Shape
// ============================================================================

interface CloudShapeProps {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}

export function CloudShape({ x, y, scale = 1, opacity = 0.8 }: CloudShapeProps) {
  // A simple cloud made of overlapping ellipses
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx="0" cy="0" rx="20" ry="12" fill="#d0d0d0" />
      <ellipse cx="-15" cy="5" rx="15" ry="10" fill="#d0d0d0" />
      <ellipse cx="15" cy="5" rx="18" ry="11" fill="#d0d0d0" />
      <ellipse cx="5" cy="-5" rx="12" ry="8" fill="#e0e0e0" />
      <ellipse cx="-8" cy="-3" rx="10" ry="7" fill="#e0e0e0" />
    </g>
  );
}

// ============================================================================
// Raindrop
// ============================================================================

interface RaindropProps {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
}

export function Raindrop({ x, y, size = 5, opacity = 0.7 }: RaindropProps) {
  // Teardrop shape
  const height = size * 1.5;
  return (
    <path
      d={`M ${x} ${y - height / 2} 
          Q ${x + size / 2} ${y} ${x} ${y + height / 2}
          Q ${x - size / 2} ${y} ${x} ${y - height / 2}`}
      fill="#4dabf7"
      opacity={opacity}
    />
  );
}

// ============================================================================
// Snowflake
// ============================================================================

interface SnowflakeProps {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
}

export function Snowflake({ x, y, size = 6, opacity = 0.8 }: SnowflakeProps) {
  // Six-pointed snowflake
  const r = size / 2;
  const branches: string[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const x1 = x + Math.cos(angle) * r;
    const y1 = y + Math.sin(angle) * r;
    branches.push(`M ${x} ${y} L ${x1} ${y1}`);
    
    // Add small branches
    const branchAngle1 = angle + Math.PI / 6;
    const branchAngle2 = angle - Math.PI / 6;
    const midX = x + Math.cos(angle) * r * 0.6;
    const midY = y + Math.sin(angle) * r * 0.6;
    const branchLen = r * 0.3;
    branches.push(`M ${midX} ${midY} L ${midX + Math.cos(branchAngle1) * branchLen} ${midY + Math.sin(branchAngle1) * branchLen}`);
    branches.push(`M ${midX} ${midY} L ${midX + Math.cos(branchAngle2) * branchLen} ${midY + Math.sin(branchAngle2) * branchLen}`);
  }
  
  return (
    <path
      d={branches.join(' ')}
      stroke="#e3f2fd"
      strokeWidth={size / 6}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    />
  );
}

// ============================================================================
// Wind Arrow
// ============================================================================

interface WindArrowProps {
  x: number;
  y: number;
  bearing: number; // Wind direction in degrees
  size?: number;
  opacity?: number;
}

export function WindArrow({ x, y, bearing, size = 12, opacity = 0.6 }: WindArrowProps) {
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${bearing + 180})`}
      opacity={opacity}
    >
      {/* Chevron arrow */}
      <path
        d={`M 0 ${-size / 2} L ${size / 3} 0 L 0 ${size / 2}`}
        stroke="#94a3b8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

// ============================================================================
// Ice Formation
// ============================================================================

interface IceFormationProps {
  width: number;
  height: number;
  intensity: number; // 0-1, affects jaggedness
  color?: string;
}

export function IceFormation({ width, height, intensity, color = '#64b5f6' }: IceFormationProps) {
  // Generate jagged ice crystals based on intensity
  const numPeaks = Math.floor(5 + intensity * 15);
  const maxHeight = 4 + intensity * 26; // 4px to 30px
  
  // Use a seeded random for consistent rendering
  const seed = Math.floor(intensity * 1000);
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };
  
  const points: string[] = [`0,${height}`];
  
  for (let i = 0; i <= numPeaks; i++) {
    const x = (i / numPeaks) * width;
    const peakHeight = seededRandom(i) * maxHeight;
    const isSpike = seededRandom(i + 100) > 0.3;
    
    if (isSpike && i > 0 && i < numPeaks) {
      // Create a sharp spike
      const spikeX = x - (width / numPeaks) * 0.3;
      points.push(`${spikeX},${height - peakHeight * 0.3}`);
      points.push(`${x},${height - peakHeight}`);
      const spikeX2 = x + (width / numPeaks) * 0.3;
      points.push(`${spikeX2},${height - peakHeight * 0.3}`);
    } else {
      points.push(`${x},${height - peakHeight * 0.5}`);
    }
  }
  
  points.push(`${width},${height}`);
  
  return (
    <polygon
      points={points.join(' ')}
      fill={color}
      opacity={0.7 + intensity * 0.3}
    />
  );
}

// ============================================================================
// Puddle
// ============================================================================

interface PuddleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  showRipples?: boolean;
}

export function Puddle({ x, y, width, height, showRipples = false }: PuddleProps) {
  return (
    <g>
      {/* Main puddle */}
      <ellipse
        cx={x}
        cy={y}
        rx={width / 2}
        ry={height / 2}
        fill="rgba(100, 149, 237, 0.4)"
      />
      {/* Highlight */}
      <ellipse
        cx={x - width * 0.15}
        cy={y - height * 0.1}
        rx={width * 0.2}
        ry={height * 0.15}
        fill="rgba(255, 255, 255, 0.2)"
      />
      {/* Ripples */}
      {showRipples && (
        <>
          <ellipse
            cx={x + width * 0.1}
            cy={y}
            rx={width * 0.15}
            ry={height * 0.1}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.5}
          />
          <ellipse
            cx={x + width * 0.1}
            cy={y}
            rx={width * 0.25}
            ry={height * 0.15}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={0.5}
          />
        </>
      )}
    </g>
  );
}

// ============================================================================
// Sand Ground
// ============================================================================

interface SandGroundProps {
  width: number;
  height: number;
  intensity: number; // 0-1, affects heat shimmer
}

export function SandGround({ width, height, intensity }: SandGroundProps) {
  // Generate sand texture dots
  const numDots = 50;
  const dots: Array<{ x: number; y: number; r: number }> = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 42) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < numDots; i++) {
    dots.push({
      x: seededRandom(i) * width,
      y: seededRandom(i + 100) * height,
      r: 0.5 + seededRandom(i + 200) * 1,
    });
  }
  
  return (
    <g>
      {/* Sand base */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#e9c46a"
        opacity={0.8}
      />
      {/* Sand texture */}
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill="#d4a853"
          opacity={0.5}
        />
      ))}
      {/* Heat shimmer lines (when intense) */}
      {intensity > 0.5 && (
        <g opacity={(intensity - 0.5) * 2}>
          {[0.2, 0.5, 0.8].map((pos, i) => (
            <path
              key={i}
              d={`M ${pos * width - 10} ${-5} Q ${pos * width} ${-15} ${pos * width + 10} ${-5}`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
              fill="none"
            />
          ))}
        </g>
      )}
    </g>
  );
}

// ============================================================================
// Seasonal Ground Elements
// ============================================================================

interface SeasonalGroundProps {
  width: number;
  height: number;
  season: Season;
}

export function SeasonalGround({ width, height, season }: SeasonalGroundProps) {
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 123) * 10000;
    return x - Math.floor(x);
  };
  
  switch (season) {
    case 'spring':
      return <SpringGround width={width} height={height} seededRandom={seededRandom} />;
    case 'summer':
      return <SummerGround width={width} height={height} seededRandom={seededRandom} />;
    case 'fall':
      return <FallGround width={width} height={height} seededRandom={seededRandom} />;
    case 'winter':
      return <WinterGround width={width} height={height} seededRandom={seededRandom} />;
  }
}

interface GroundProps {
  width: number;
  height: number;
  seededRandom: (i: number) => number;
}

function SpringGround({ width, height, seededRandom }: GroundProps) {
  const numElements = 12;
  const elements: JSX.Element[] = [];
  
  for (let i = 0; i < numElements; i++) {
    const x = seededRandom(i) * width;
    const isFlower = seededRandom(i + 50) > 0.5;
    
    if (isFlower) {
      // Simple flower
      const color = ['#ff6b6b', '#ffa94d', '#ffd43b', '#ff8787', '#e599f7'][
        Math.floor(seededRandom(i + 100) * 5)
      ];
      elements.push(
        <g key={i} transform={`translate(${x}, ${height - 2})`}>
          {/* Stem */}
          <line x1={0} y1={0} x2={0} y2={-8} stroke="#40c057" strokeWidth={1} />
          {/* Petals */}
          <circle cx={0} cy={-10} r={3} fill={color} />
          <circle cx={0} cy={-8} r={2} fill="#ffd43b" />
        </g>
      );
    } else {
      // Grass blade
      const grassHeight = 4 + seededRandom(i + 200) * 6;
      const lean = (seededRandom(i + 300) - 0.5) * 4;
      elements.push(
        <path
          key={i}
          d={`M ${x} ${height} Q ${x + lean} ${height - grassHeight / 2} ${x + lean * 1.5} ${height - grassHeight}`}
          stroke="#40c057"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
  }
  
  return <g>{elements}</g>;
}

function SummerGround({ width, height, seededRandom }: GroundProps) {
  const numBlades = 20;
  const elements: JSX.Element[] = [];
  
  for (let i = 0; i < numBlades; i++) {
    const x = seededRandom(i) * width;
    const grassHeight = 5 + seededRandom(i + 200) * 8;
    const lean = (seededRandom(i + 300) - 0.5) * 5;
    
    elements.push(
      <path
        key={i}
        d={`M ${x} ${height} Q ${x + lean} ${height - grassHeight / 2} ${x + lean * 1.5} ${height - grassHeight}`}
        stroke="#2f9e44"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  
  return <g>{elements}</g>;
}

function FallGround({ width, height, seededRandom }: GroundProps) {
  const numLeaves = 10;
  const elements: JSX.Element[] = [];
  
  const leafColors = ['#e8590c', '#d9480f', '#f76707', '#ffa94d', '#c92a2a'];
  
  for (let i = 0; i < numLeaves; i++) {
    const x = seededRandom(i) * width;
    const y = height - 2 - seededRandom(i + 50) * 4;
    const color = leafColors[Math.floor(seededRandom(i + 100) * leafColors.length)];
    const rotation = seededRandom(i + 200) * 360;
    const size = 3 + seededRandom(i + 300) * 3;
    
    elements.push(
      <g key={i} transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size / 5})`}>
        {/* Simple leaf shape */}
        <path
          d="M 0 0 Q 3 -2 5 0 Q 3 2 0 0"
          fill={color}
        />
        {/* Stem */}
        <line x1={0} y1={0} x2={-2} y2={1} stroke="#8b5a2b" strokeWidth={0.5} />
      </g>
    );
  }
  
  return <g>{elements}</g>;
}

function WinterGround({ width, height, seededRandom }: GroundProps) {
  const numElements = 8;
  const elements: JSX.Element[] = [];
  
  for (let i = 0; i < numElements; i++) {
    const x = seededRandom(i) * width;
    const isTwig = seededRandom(i + 50) > 0.3;
    
    if (isTwig) {
      // Bare twig
      const twigHeight = 5 + seededRandom(i + 200) * 8;
      const lean = (seededRandom(i + 300) - 0.5) * 3;
      elements.push(
        <g key={i}>
          <path
            d={`M ${x} ${height} L ${x + lean} ${height - twigHeight}`}
            stroke="#8b5a2b"
            strokeWidth={1}
            strokeLinecap="round"
          />
          {/* Small branches */}
          <path
            d={`M ${x + lean * 0.5} ${height - twigHeight * 0.6} L ${x + lean + 3} ${height - twigHeight * 0.7}`}
            stroke="#8b5a2b"
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        </g>
      );
    } else {
      // Small evergreen sprig
      const sprigHeight = 6 + seededRandom(i + 400) * 4;
      elements.push(
        <g key={i} transform={`translate(${x}, ${height})`}>
          <line x1={0} y1={0} x2={0} y2={-sprigHeight} stroke="#2f9e44" strokeWidth={1} />
          <path
            d={`M -3 ${-sprigHeight * 0.3} L 0 ${-sprigHeight * 0.5} L 3 ${-sprigHeight * 0.3}`}
            stroke="#2f9e44"
            strokeWidth={1}
            fill="none"
          />
          <path
            d={`M -2 ${-sprigHeight * 0.6} L 0 ${-sprigHeight * 0.8} L 2 ${-sprigHeight * 0.6}`}
            stroke="#2f9e44"
            strokeWidth={1}
            fill="none"
          />
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
}

// ============================================================================
// Precipitation Grid Generator
// ============================================================================

interface PrecipitationGridProps {
  width: number;
  height: number;
  type: 'rain' | 'snow' | 'mixed';
  size: number;
  opacity: number;
  density?: number; // 0-1, controls how many drops/flakes
}

export function PrecipitationGrid({ 
  width, 
  height, 
  type, 
  size, 
  opacity, 
  density = 0.5 
}: PrecipitationGridProps) {
  if (size === 0) return null;
  
  // Create offset grid (honeycomb pattern)
  const cols = Math.ceil(width / (size * 4));
  const rows = Math.ceil(height / (size * 3));
  const elements: JSX.Element[] = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 777) * 10000;
    return x - Math.floor(x);
  };
  
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Skip some based on density
      if (seededRandom(idx) > density) {
        idx++;
        continue;
      }
      
      const offsetX = row % 2 === 0 ? 0 : size * 2;
      const x = col * size * 4 + offsetX + seededRandom(idx + 1000) * size;
      const y = row * size * 3 + seededRandom(idx + 2000) * size;
      
      if (type === 'rain') {
        elements.push(
          <Raindrop key={idx} x={x} y={y} size={size} opacity={opacity} />
        );
      } else if (type === 'snow') {
        elements.push(
          <Snowflake key={idx} x={x} y={y} size={size} opacity={opacity} />
        );
      } else {
        // Mixed - alternate
        if (seededRandom(idx + 3000) > 0.5) {
          elements.push(
            <Raindrop key={idx} x={x} y={y} size={size} opacity={opacity} />
          );
        } else {
          elements.push(
            <Snowflake key={idx} x={x} y={y} size={size} opacity={opacity} />
          );
        }
      }
      
      idx++;
    }
  }
  
  return <g>{elements}</g>;
}

// ============================================================================
// Cloud Layer Generator
// ============================================================================

interface CloudLayerProps {
  width: number;
  height: number;
  coverage: number; // 0-100
}

export function CloudLayer({ width, height, coverage }: CloudLayerProps) {
  if (coverage < 5) return null;
  
  // Number of clouds based on coverage
  const numClouds = Math.ceil((coverage / 100) * 8);
  const clouds: JSX.Element[] = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 555) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < numClouds; i++) {
    const x = seededRandom(i) * width;
    const y = seededRandom(i + 100) * height * 0.6 + height * 0.2;
    const scale = 0.5 + seededRandom(i + 200) * 0.5;
    const cloudOpacity = 0.4 + (coverage / 100) * 0.5;
    
    clouds.push(
      <CloudShape key={i} x={x} y={y} scale={scale} opacity={cloudOpacity} />
    );
  }
  
  return <g>{clouds}</g>;
}

// ============================================================================
// Wind Arrows Layer
// ============================================================================

interface WindArrowsLayerProps {
  width: number;
  height: number;
  bearing: number;
  count: number;
}

export function WindArrowsLayer({ width, height, bearing, count }: WindArrowsLayerProps) {
  if (count === 0) return null;
  
  const arrows: JSX.Element[] = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 888) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < count; i++) {
    const x = width * 0.6 + seededRandom(i) * width * 0.35;
    const y = height * 0.3 + seededRandom(i + 100) * height * 0.4;
    const size = 10 + seededRandom(i + 200) * 6;
    
    arrows.push(
      <WindArrow key={i} x={x} y={y} bearing={bearing} size={size} opacity={0.5} />
    );
  }
  
  return <g>{arrows}</g>;
}
