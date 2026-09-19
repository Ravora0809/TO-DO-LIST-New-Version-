import { Point, WhiteboardElement, WhiteboardBoard } from '../../types';
import jsPDF from 'jspdf';

// -------------------------------------------------------------
// Coordinate & Geometry Math
// -------------------------------------------------------------

export function screenToCanvasPoint(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  pan: Point,
  zoom: number
): Point {
  return {
    x: (clientX - containerRect.left - pan.x) / zoom,
    y: (clientY - containerRect.top - pan.y) / zoom,
  };
}

export function snapPointToGrid(point: Point, gridSize: number = 20): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function getElementBoundingBox(el: WhiteboardElement): BoundingBox {
  let minX = el.x;
  let minY = el.y;
  let maxX = el.x + el.width;
  let maxY = el.y + el.height;

  if (el.points && el.points.length > 0) {
    minX = Math.min(...el.points.map((p) => p.x));
    maxX = Math.max(...el.points.map((p) => p.x));
    minY = Math.min(...el.points.map((p) => p.y));
    maxY = Math.max(...el.points.map((p) => p.y));
  }

  // Handle negative width/height
  if (minX > maxX) [minX, maxX] = [maxX, minX];
  if (minY > maxY) [minY, maxY] = [maxY, minY];

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function getCombinedBoundingBox(elements: WhiteboardElement[]): BoundingBox | null {
  if (elements.length === 0) return null;
  const boxes = elements.map(getElementBoundingBox);
  const minX = Math.min(...boxes.map((b) => b.minX));
  const minY = Math.min(...boxes.map((b) => b.minY));
  const maxX = Math.max(...boxes.map((b) => b.maxX));
  const maxY = Math.max(...boxes.map((b) => b.maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

// -------------------------------------------------------------
// SVG Path Generators for Rich Shapes
// -------------------------------------------------------------

export function generateStarPath(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): string {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  let path = '';

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    path += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    path += ' L ' + x.toFixed(2) + ' ' + y.toFixed(2);
    rot += step;
  }
  path += ' Z';
  return path;
}

export function generateRegularPolygonPath(cx: number, cy: number, sides: number, radius: number): string {
  let path = '';
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    path += (i === 0 ? 'M ' : ' L ') + px.toFixed(2) + ' ' + py.toFixed(2);
  }
  path += ' Z';
  return path;
}

export function pointsToSmoothSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    path += ` Q ${p0.x} ${p0.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

// -------------------------------------------------------------
// Alignment & Distribution
// -------------------------------------------------------------

export function alignElements(
  elements: WhiteboardElement[],
  selectedIds: string[],
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): WhiteboardElement[] {
  const selected = elements.filter((e) => selectedIds.includes(e.id) && !e.locked);
  if (selected.length < 2) return elements;

  const bbox = getCombinedBoundingBox(selected);
  if (!bbox) return elements;

  return elements.map((el) => {
    if (!selectedIds.includes(el.id) || el.locked) return el;
    const elBox = getElementBoundingBox(el);

    let newX = el.x;
    let newY = el.y;

    switch (type) {
      case 'left':
        newX = bbox.minX;
        break;
      case 'center':
        newX = bbox.centerX - elBox.width / 2;
        break;
      case 'right':
        newX = bbox.maxX - elBox.width;
        break;
      case 'top':
        newY = bbox.minY;
        break;
      case 'middle':
        newY = bbox.centerY - elBox.height / 2;
        break;
      case 'bottom':
        newY = bbox.maxY - elBox.height;
        break;
    }

    return { ...el, x: Math.round(newX), y: Math.round(newY) };
  });
}

export function distributeElements(
  elements: WhiteboardElement[],
  selectedIds: string[],
  direction: 'horizontal' | 'vertical'
): WhiteboardElement[] {
  const selected = elements.filter((e) => selectedIds.includes(e.id) && !e.locked);
  if (selected.length < 3) return elements;

  if (direction === 'horizontal') {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const minX = sorted[0].x;
    const last = sorted[sorted.length - 1];
    const maxX = last.x + last.width;
    const totalWidths = sorted.reduce((sum, el) => sum + el.width, 0);
    const availableGap = (maxX - minX - totalWidths) / (sorted.length - 1);

    let currentX = minX;
    const newPositions = new Map<string, number>();

    sorted.forEach((el, index) => {
      if (index === 0) {
        newPositions.set(el.id, el.x);
        currentX += el.width + availableGap;
      } else if (index === sorted.length - 1) {
        newPositions.set(el.id, el.x);
      } else {
        newPositions.set(el.id, Math.round(currentX));
        currentX += el.width + availableGap;
      }
    });

    return elements.map((el) => {
      if (newPositions.has(el.id)) {
        return { ...el, x: newPositions.get(el.id)! };
      }
      return el;
    });
  } else {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const minY = sorted[0].y;
    const last = sorted[sorted.length - 1];
    const maxY = last.y + last.height;
    const totalHeights = sorted.reduce((sum, el) => sum + el.height, 0);
    const availableGap = (maxY - minY - totalHeights) / (sorted.length - 1);

    let currentY = minY;
    const newPositions = new Map<string, number>();

    sorted.forEach((el, index) => {
      if (index === 0) {
        newPositions.set(el.id, el.y);
        currentY += el.height + availableGap;
      } else if (index === sorted.length - 1) {
        newPositions.set(el.id, el.y);
      } else {
        newPositions.set(el.id, Math.round(currentY));
        currentY += el.height + availableGap;
      }
    });

    return elements.map((el) => {
      if (newPositions.has(el.id)) {
        return { ...el, y: newPositions.get(el.id)! };
      }
      return el;
    });
  }
}

// -------------------------------------------------------------
// Alignment Guides Detection
// -------------------------------------------------------------

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
}

export function computeAlignmentGuides(
  activeBox: BoundingBox,
  otherElements: WhiteboardElement[],
  threshold: number = 6
): { snappedX: number; snappedY: number; guides: AlignmentGuide[] } {
  let snappedX = activeBox.minX;
  let snappedY = activeBox.minY;
  const guides: AlignmentGuide[] = [];

  const otherBoxes = otherElements.map(getElementBoundingBox);

  // Check X alignments (left, center, right)
  for (const box of otherBoxes) {
    // Left with Left
    if (Math.abs(activeBox.minX - box.minX) < threshold) {
      snappedX = box.minX;
      guides.push({ type: 'vertical', position: box.minX });
      break;
    }
    // Center with Center
    if (Math.abs(activeBox.centerX - box.centerX) < threshold) {
      snappedX = box.centerX - activeBox.width / 2;
      guides.push({ type: 'vertical', position: box.centerX });
      break;
    }
    // Right with Right
    if (Math.abs(activeBox.maxX - box.maxX) < threshold) {
      snappedX = box.maxX - activeBox.width;
      guides.push({ type: 'vertical', position: box.maxX });
      break;
    }
  }

  // Check Y alignments (top, middle, bottom)
  for (const box of otherBoxes) {
    // Top with Top
    if (Math.abs(activeBox.minY - box.minY) < threshold) {
      snappedY = box.minY;
      guides.push({ type: 'horizontal', position: box.minY });
      break;
    }
    // Middle with Middle
    if (Math.abs(activeBox.centerY - box.centerY) < threshold) {
      snappedY = box.centerY - activeBox.height / 2;
      guides.push({ type: 'horizontal', position: box.centerY });
      break;
    }
    // Bottom with Bottom
    if (Math.abs(activeBox.maxY - box.maxY) < threshold) {
      snappedY = box.maxY - activeBox.height;
      guides.push({ type: 'horizontal', position: box.maxY });
      break;
    }
  }

  return { snappedX: Math.round(snappedX), snappedY: Math.round(snappedY), guides };
}

// -------------------------------------------------------------
// Export Helpers (PNG, SVG, PDF, JSON)
// -------------------------------------------------------------

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportBoardToSVG(svgElement: SVGSVGElement, fileName: string, elements: WhiteboardElement[] = []): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  // Remove temporary overlays, handles, guides
  const overlays = clone.querySelectorAll('.canvas-ui-overlay');
  overlays.forEach((el) => el.remove());

  const worldLayer = clone.querySelector('#board-world-layer');
  if (worldLayer) {
    worldLayer.setAttribute('transform', 'translate(0, 0) scale(1)');
  }

  const bbox = getCombinedBoundingBox(elements);
  const padding = 60;
  const exportMinX = bbox ? bbox.minX - padding : 0;
  const exportMinY = bbox ? bbox.minY - padding : 0;
  const exportWidth = bbox ? Math.max(bbox.width + padding * 2, 800) : 1200;
  const exportHeight = bbox ? Math.max(bbox.height + padding * 2, 600) : 800;

  clone.setAttribute('viewBox', `${exportMinX} ${exportMinY} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('width', `${exportWidth}`);
  clone.setAttribute('height', `${exportHeight}`);

  const serializer = new XMLSerializer();
  const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(clone);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${fileName}.svg`);
}

export function exportBoardToPNG(
  svgElement: SVGSVGElement,
  fileName: string,
  elements: WhiteboardElement[],
  bgColor: string = '#ffffff'
): void {
  const bbox = getCombinedBoundingBox(elements);
  const padding = 60;

  const exportMinX = bbox ? bbox.minX - padding : 0;
  const exportMinY = bbox ? bbox.minY - padding : 0;
  const exportWidth = bbox ? Math.max(bbox.width + padding * 2, 800) : 1200;
  const exportHeight = bbox ? Math.max(bbox.height + padding * 2, 600) : 800;

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const overlays = clone.querySelectorAll('.canvas-ui-overlay');
  overlays.forEach((el) => el.remove());

  const worldLayer = clone.querySelector('#board-world-layer');
  if (worldLayer) {
    worldLayer.setAttribute('transform', 'translate(0, 0) scale(1)');
  }

  // Wrap inside export viewport
  clone.setAttribute('viewBox', `${exportMinX} ${exportMinY} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('width', `${exportWidth}`);
  clone.setAttribute('height', `${exportHeight}`);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = window.URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scaleFactor = 2; // High-res retina 2x
    canvas.width = exportWidth * scaleFactor;
    canvas.height = exportHeight * scaleFactor;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scaleFactor, scaleFactor);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${fileName}.png`);
        }
        window.URL.revokeObjectURL(blobURL);
      }, 'image/png');
    }
  };
  img.src = blobURL;
}

export function exportBoardToPDF(
  svgElement: SVGSVGElement,
  fileName: string,
  elements: WhiteboardElement[],
  boardName: string,
  bgColor: string = '#ffffff'
): void {
  const bbox = getCombinedBoundingBox(elements);
  const padding = 60;

  const exportMinX = bbox ? bbox.minX - padding : 0;
  const exportMinY = bbox ? bbox.minY - padding : 0;
  const exportWidth = bbox ? Math.max(bbox.width + padding * 2, 800) : 1200;
  const exportHeight = bbox ? Math.max(bbox.height + padding * 2, 600) : 800;

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const overlays = clone.querySelectorAll('.canvas-ui-overlay');
  overlays.forEach((el) => el.remove());

  const worldLayer = clone.querySelector('#board-world-layer');
  if (worldLayer) {
    worldLayer.setAttribute('transform', 'translate(0, 0) scale(1)');
  }

  clone.setAttribute('viewBox', `${exportMinX} ${exportMinY} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('width', `${exportWidth}`);
  clone.setAttribute('height', `${exportHeight}`);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = window.URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scaleFactor = 2;
    canvas.width = exportWidth * scaleFactor;
    canvas.height = exportHeight * scaleFactor;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scaleFactor, scaleFactor);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = exportWidth >= exportHeight;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [exportWidth, exportHeight],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, exportWidth, exportHeight);
      pdf.save(`${fileName}.pdf`);
      window.URL.revokeObjectURL(blobURL);
    }
  };
  img.src = blobURL;
}

export function exportBoardToJSON(board: WhiteboardBoard): void {
  const jsonStr = JSON.stringify(board, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const sanitized = board.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  downloadBlob(blob, `${sanitized || 'whiteboard'}.json`);
}
