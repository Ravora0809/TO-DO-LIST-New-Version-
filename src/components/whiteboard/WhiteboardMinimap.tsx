import React, { useRef, useCallback } from 'react';
import { WhiteboardElement, Point } from '../../types';
import { getCombinedBoundingBox, BoundingBox } from './whiteboardUtils';
import { Maximize2, X } from 'lucide-react';

interface WhiteboardMinimapProps {
  elements: WhiteboardElement[];
  pan: Point;
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onPanChange: (newPan: Point) => void;
  onClose: () => void;
}

export const WhiteboardMinimap: React.FC<WhiteboardMinimapProps> = ({
  elements,
  pan,
  zoom,
  containerWidth,
  containerHeight,
  onPanChange,
  onClose,
}) => {
  const mapWidth = 180;
  const mapHeight = 120;
  const padding = 200;

  // Compute total world bounds including elements and current viewport
  const viewLeft = -pan.x / zoom;
  const viewTop = -pan.y / zoom;
  const viewRight = viewLeft + containerWidth / zoom;
  const viewBottom = viewTop + containerHeight / zoom;

  const bbox = getCombinedBoundingBox(elements) || {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 800,
    width: 1000,
    height: 800,
    centerX: 500,
    centerY: 400,
  };

  const worldMinX = Math.min(bbox.minX - padding, viewLeft - padding);
  const worldMinY = Math.min(bbox.minY - padding, viewTop - padding);
  const worldMaxX = Math.max(bbox.maxX + padding, viewRight + padding);
  const worldMaxY = Math.max(bbox.maxY + padding, viewBottom + padding);

  const worldWidth = Math.max(worldMaxX - worldMinX, 800);
  const worldHeight = Math.max(worldMaxY - worldMinY, 600);

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  const toMapX = (wx: number) => (wx - worldMinX) * scale + (mapWidth - worldWidth * scale) / 2;
  const toMapY = (wy: number) => (wy - worldMinY) * scale + (mapHeight - worldHeight * scale) / 2;

  const toWorldX = (mx: number) => (mx - (mapWidth - worldWidth * scale) / 2) / scale + worldMinX;
  const toWorldY = (my: number) => (my - (mapHeight - worldHeight * scale) / 2) / scale + worldMinY;

  // Viewport rect in minimap coordinates
  const vpX = toMapX(viewLeft);
  const vpY = toMapY(viewTop);
  const vpW = Math.max((containerWidth / zoom) * scale, 12);
  const vpH = Math.max((containerHeight / zoom) * scale, 8);

  const handleMinimapInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickMapX = e.clientX - rect.left;
    const clickMapY = e.clientY - rect.top;

    const targetWorldX = toWorldX(clickMapX);
    const targetWorldY = toWorldY(clickMapY);

    const newPanX = -(targetWorldX - (containerWidth / (2 * zoom))) * zoom;
    const newPanY = -(targetWorldY - (containerHeight / (2 * zoom))) * zoom;

    onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  return (
    <div className="absolute bottom-20 right-6 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3 text-sky-500" />
          Minimap
        </span>
        <button
          onClick={onClose}
          className="p-0.5 hover:text-neutral-800 dark:hover:text-white rounded transition"
          title="Close minimap"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className="relative bg-neutral-50 dark:bg-neutral-950 cursor-crosshair overflow-hidden"
        style={{ width: mapWidth, height: mapHeight }}
        onClick={handleMinimapInteraction}
      >
        {/* Render elements as mini nodes */}
        {elements
          .filter((el) => !el.hidden)
          .map((el) => {
            const mx = toMapX(el.x);
            const my = toMapY(el.y);
            const mw = Math.max(el.width * scale, 3);
            const mh = Math.max(el.height * scale, 3);

            return (
              <div
                key={el.id}
                className="absolute rounded-xs pointer-events-none transition-opacity"
                style={{
                  left: mx,
                  top: my,
                  width: mw,
                  height: mh,
                  backgroundColor: el.fill && el.fill !== 'transparent' ? el.fill : el.stroke || '#94a3b8',
                  border: `0.5px solid ${el.stroke || '#64748b'}`,
                  opacity: 0.75,
                }}
              />
            );
          })}

        {/* Viewport Frame */}
        <div
          className="absolute border-2 border-sky-500 bg-sky-500/15 rounded-xs pointer-events-none transition-all duration-75 shadow-xs"
          style={{
            left: Math.max(vpX, 0),
            top: Math.max(vpY, 0),
            width: Math.min(vpW, mapWidth),
            height: Math.min(vpH, mapHeight),
          }}
        />
      </div>
    </div>
  );
};
