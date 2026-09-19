import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  WhiteboardBoard,
  WhiteboardElement,
  WhiteboardTool,
  WhiteboardElementType,
  Point,
} from '../../types';
import {
  getWhiteboardBoards,
  saveWhiteboardBoards,
  getActiveBoardId,
  setActiveBoardId,
} from '../../services/whiteboardStorage';
import {
  ICON_REGISTRY,
  ICON_CATEGORIES,
  WhiteboardIconRenderer,
} from '../whiteboard/WhiteboardIcons';
import {
  screenToCanvasPoint,
  snapPointToGrid,
  getElementBoundingBox,
  getCombinedBoundingBox,
  generateStarPath,
  generateRegularPolygonPath,
  pointsToSmoothSvgPath,
  alignElements,
  distributeElements,
  computeAlignmentGuides,
  AlignmentGuide,
  exportBoardToPNG,
  exportBoardToSVG,
  exportBoardToPDF,
  exportBoardToJSON,
} from '../whiteboard/whiteboardUtils';
import { WhiteboardToolbar } from '../whiteboard/WhiteboardToolbar';
import { WhiteboardTopNav } from '../whiteboard/WhiteboardTopNav';
import { WhiteboardPropertiesPanel } from '../whiteboard/WhiteboardPropertiesPanel';
import { WhiteboardLayersPanel } from '../whiteboard/WhiteboardLayersPanel';
import { WhiteboardMinimap } from '../whiteboard/WhiteboardMinimap';
import { WhiteboardHelpModal } from '../whiteboard/WhiteboardHelpModal';
import { WhiteboardShareModal } from '../whiteboard/WhiteboardShareModal';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';

interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const WhiteboardView: React.FC = () => {
  const [boards, setBoards] = useState<WhiteboardBoard[]>([]);
  const [activeBoardId, setActiveId] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<WhiteboardTool>('select');

  // Canvas Viewport State
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  // Selected Elements (Multi-selection support)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboardElements, setClipboardElements] = useState<WhiteboardElement[]>([]);

  // Inline Text Editing
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Undo / Redo stacks
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Marquee Selection Box
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState<boolean>(false);
  const [marqueeStart, setMarqueeStart] = useState<Point>({ x: 0, y: 0 });
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point>({ x: 0, y: 0 });

  // Dragging & Resizing State
  const [isDraggingElements, setIsDraggingElements] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [elementStartSnapshots, setElementStartSnapshots] = useState<Map<string, Point>>(new Map());

  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartBox, setResizeStartBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotationCenter, setRotationCenter] = useState<Point>({ x: 0, y: 0 });

  // Active Alignment Guides
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  // Freehand & Marker Points
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point[]>([]);
  const [isFreehandDrawing, setIsFreehandDrawing] = useState<boolean>(false);

  // Laser Pointer Trail
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [isLaserDrawing, setIsLaserDrawing] = useState<boolean>(false);

  // Modals & Panels State
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridMode, setGridMode] = useState<'dots' | 'lines' | 'none'>('dots');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState<boolean>(false);
  const [iconSearch, setIconSearch] = useState<string>('');
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState<boolean>(false);
  const [newBoardNameInput, setNewBoardNameInput] = useState<string>('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

  // Default Element Styles
  const [activeFill, setActiveFill] = useState<string>('#e0f2fe');
  const [activeStroke, setActiveStroke] = useState<string>('#0284c7');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(2);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const laserAnimRef = useRef<number | null>(null);

  // -------------------------------------------------------------
  // Initialization & Storage Loading
  // -------------------------------------------------------------
  useEffect(() => {
    const loaded = getWhiteboardBoards();
    setBoards(loaded);
    const active = getActiveBoardId();
    const found = loaded.find((b) => b.id === active) || loaded[0];
    if (found) {
      setActiveId(found.id);
      setHistory([found.elements]);
      if (found.gridMode) setGridMode(found.gridMode);
      if (found.snapToGrid !== undefined) setSnapToGrid(found.snapToGrid);
      if (found.showMinimap !== undefined) setShowMinimap(found.showMinimap);
    }
  }, []);

  const activeBoard = useMemo(() => {
    return boards.find((b) => b.id === activeBoardId) || boards[0] || null;
  }, [boards, activeBoardId]);

  // Responsive Canvas Size Tracking
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update elements in state and persist with history
  const updateElements = useCallback(
    (newElements: WhiteboardElement[], recordHistory = true) => {
      if (!activeBoardId) return;

      if (recordHistory && activeBoard) {
        setHistory((prev) => [...prev.slice(-40), activeBoard.elements]);
        setRedoStack([]);
      }

      setSaveStatus('saving');
      setBoards((prev) => {
        const updated = prev.map((b) =>
          b.id === activeBoardId
            ? { ...b, elements: newElements, updatedAt: new Date().toISOString() }
            : b
        );
        saveWhiteboardBoards(updated);
        return updated;
      });

      setTimeout(() => setSaveStatus('saved'), 350);
    },
    [activeBoardId, activeBoard]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || !activeBoard) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, activeBoard.elements]);
    setHistory((prev) => prev.slice(0, -1));
    updateElements(previous, false);
    setSelectedIds([]);
  }, [history, activeBoard, updateElements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !activeBoard) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, activeBoard.elements]);
    setRedoStack((prev) => prev.slice(0, -1));
    updateElements(next, false);
    setSelectedIds([]);
  }, [redoStack, activeBoard, updateElements]);

  // -------------------------------------------------------------
  // Laser Pointer Animation Loop
  // -------------------------------------------------------------
  useEffect(() => {
    const updateLaser = () => {
      const now = Date.now();
      setLaserPoints((prev) => {
        const filtered = prev.filter((p) => now - p.time < 1200);
        return filtered.length !== prev.length ? filtered : prev;
      });
      laserAnimRef.current = requestAnimationFrame(updateLaser);
    };
    laserAnimRef.current = requestAnimationFrame(updateLaser);
    return () => {
      if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // Global Keyboard Shortcuts
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Space pan trigger
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      // Modifier combinations
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (activeBoard) {
          setSelectedIds(activeBoard.elements.filter((el) => !el.hidden).map((el) => el.id));
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (activeBoard && selectedIds.length > 0) {
          const toCopy = activeBoard.elements.filter((el) => selectedIds.includes(el.id));
          setClipboardElements(toCopy);
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (activeBoard && clipboardElements.length > 0) {
          const pasted = clipboardElements.map((el, i) => ({
            ...el,
            id: `elem-${Date.now()}-${i}`,
            x: el.x + 40,
            y: el.y + 40,
            zIndex: activeBoard.elements.length + i + 1,
          }));
          updateElements([...activeBoard.elements, ...pasted]);
          setSelectedIds(pasted.map((p) => p.id));
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          handleUngroup();
        } else {
          handleGroup();
        }
        return;
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Escape to cancel or return to Select tool
      if (e.key === 'Escape') {
        if (editingElementId) {
          finishTextEdit();
        } else if (selectedIds.length > 0) {
          setSelectedIds([]);
        } else {
          setCurrentTool('select');
        }
        return;
      }

      // Layer ordering shortcuts [ and ]
      if (e.key === ']') {
        handleLayerOrder('forward');
        return;
      }
      if (e.key === '[') {
        handleLayerOrder('backward');
        return;
      }

      // Tool Switching Single Key Shortcuts
      if (!isCmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setCurrentTool('select');
            break;
          case 'h':
            setCurrentTool('hand');
            break;
          case 'p':
            setCurrentTool('draw');
            break;
          case 'm':
            setCurrentTool('marker');
            break;
          case 'e':
            setCurrentTool('eraser');
            break;
          case 'r':
            setCurrentTool('rectangle');
            break;
          case 'o':
            setCurrentTool('circle');
            break;
          case 't':
            setCurrentTool('text');
            break;
          case 's':
            setCurrentTool('sticky');
            break;
          case 'l':
            setCurrentTool('line');
            break;
          case 'a':
            setCurrentTool('arrow');
            break;
          case 'k':
            setCurrentTool('connector');
            break;
          case 'f':
            setCurrentTool('frame');
            break;
          case 'c':
            setCurrentTool('comment');
            break;
          case 'z':
            setCurrentTool('laser');
            break;
          case '?':
            setIsHelpModalOpen(true);
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isSpacePressed,
    handleUndo,
    handleRedo,
    activeBoard,
    selectedIds,
    clipboardElements,
    editingElementId,
  ]);

  // Coordinate conversion helper
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent | MouseEvent | React.TouchEvent): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return screenToCanvasPoint(clientX, clientY, rect, pan, zoom);
    },
    [pan, zoom]
  );

  // -------------------------------------------------------------
  // Creation of shapes at canvas location
  // -------------------------------------------------------------
  const createElementAtPoint = (type: WhiteboardElementType, pt: Point) => {
    if (!activeBoard) return;

    let snapped = snapToGrid ? snapPointToGrid(pt) : pt;
    let width = 180;
    let height = 100;
    let text = '';
    let fill = activeFill;
    let stroke = activeStroke;
    let strokeWidth = activeStrokeWidth;
    let cornerRadius = 0;
    let textColor = '#0f172a';
    let fontSize = 14;

    switch (type) {
      case 'rectangle':
        width = 180;
        height = 100;
        text = 'Idea Block';
        break;
      case 'rounded-rect':
        width = 180;
        height = 100;
        cornerRadius = 14;
        text = 'Service Component';
        break;
      case 'circle':
        width = 130;
        height = 130;
        text = 'Process';
        break;
      case 'triangle':
        width = 140;
        height = 120;
        text = 'Review';
        break;
      case 'polygon':
        width = 140;
        height = 130;
        text = 'Module';
        break;
      case 'star':
        width = 140;
        height = 140;
        fill = '#fef08a';
        stroke = '#ca8a04';
        text = 'Goal';
        textColor = '#854d0e';
        break;
      case 'diamond':
        width = 140;
        height = 120;
        text = 'Decision';
        break;
      case 'cylinder':
        width = 150;
        height = 110;
        text = 'Database';
        break;
      case 'cloud':
        width = 160;
        height = 90;
        text = 'Cloud Service';
        break;
      case 'sticky':
        width = 200;
        height = 160;
        fill = '#fef08a';
        stroke = '#eab308';
        strokeWidth = 1;
        text = '💡 Key Idea / Task:\n- Clear goals\n- Fast iteration';
        textColor = '#713f12';
        fontSize = 13;
        break;
      case 'text':
        width = 220;
        height = 50;
        fill = 'transparent';
        stroke = 'transparent';
        text = 'Double-click to edit text';
        fontSize = 18;
        break;
      case 'frame':
        width = 400;
        height = 300;
        fill = 'rgba(241, 245, 249, 0.4)';
        stroke = '#94a3b8';
        strokeWidth = 2;
        text = 'Project Section';
        break;
      case 'comment':
        width = 200;
        height = 90;
        fill = '#ffffff';
        stroke = '#0284c7';
        strokeWidth = 2;
        text = 'Feedback / Architecture note';
        break;
      case 'line':
      case 'arrow':
      case 'connector':
        width = 140;
        height = 0;
        strokeWidth = 2;
        break;
    }

    const newElement: WhiteboardElement = {
      id: `elem-${Date.now()}`,
      type,
      x: Math.round(snapped.x - width / 2),
      y: Math.round(snapped.y - height / 2),
      width,
      height,
      fill,
      stroke,
      strokeWidth,
      cornerRadius,
      text,
      textColor,
      fontSize,
      opacity: 1,
      zIndex: activeBoard.elements.length + 1,
      commentAuthor: type === 'comment' ? 'Author' : undefined,
      commentTime: type === 'comment' ? 'Just now' : undefined,
    };

    updateElements([...activeBoard.elements, newElement]);
    setSelectedIds([newElement.id]);
  };

  // Image Upload Handler
  const handleImageUpload = (file: File) => {
    if (!activeBoard) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width || 300;
        let height = img.height || 200;
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const centerPt = {
          x: -pan.x / zoom + canvasDimensions.width / (2 * zoom),
          y: -pan.y / zoom + canvasDimensions.height / (2 * zoom),
        };

        const newElement: WhiteboardElement = {
          id: `img-${Date.now()}`,
          type: 'image',
          x: Math.round(centerPt.x - width / 2),
          y: Math.round(centerPt.y - height / 2),
          width,
          height,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          imageSrc: src,
          name: file.name,
          zIndex: activeBoard.elements.length + 1,
        };

        updateElements([...activeBoard.elements, newElement]);
        setSelectedIds([newElement.id]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Icon Stamp Handler
  const handleAddIcon = (iconName: string) => {
    if (!activeBoard) return;
    const centerPt = {
      x: -pan.x / zoom + canvasDimensions.width / (2 * zoom),
      y: -pan.y / zoom + canvasDimensions.height / (2 * zoom),
    };

    const newElement: WhiteboardElement = {
      id: `icon-${Date.now()}`,
      type: 'icon',
      x: Math.round(centerPt.x - 40),
      y: Math.round(centerPt.y - 40),
      width: 80,
      height: 80,
      fill: '#ffffff',
      stroke: activeStroke,
      strokeWidth: 2,
      iconName,
      text: iconName,
      textColor: '#334155',
      fontSize: 11,
      zIndex: activeBoard.elements.length + 1,
    };

    updateElements([...activeBoard.elements, newElement]);
    setSelectedIds([newElement.id]);
    setIsIconModalOpen(false);
  };

  // -------------------------------------------------------------
  // Mouse & Touch Interaction Engine
  // -------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const isMiddleClick = e.button === 1;
    const isPanMode = currentTool === 'hand' || isSpacePressed || isMiddleClick;

    if (isPanMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pt = getCanvasCoordinates(e);

    // Laser pointer tool
    if (currentTool === 'laser') {
      setIsLaserDrawing(true);
      setLaserPoints((prev) => [...prev, { x: pt.x, y: pt.y, time: Date.now() }]);
      return;
    }

    // Freehand drawing (Pencil or Marker)
    if (currentTool === 'draw' || currentTool === 'marker') {
      setIsFreehandDrawing(true);
      setCurrentFreehandPoints([pt]);
      return;
    }

    // Shape creation on canvas click
    if (
      [
        'rectangle',
        'rounded-rect',
        'circle',
        'triangle',
        'polygon',
        'star',
        'diamond',
        'cylinder',
        'cloud',
        'text',
        'sticky',
        'frame',
        'comment',
        'line',
        'arrow',
        'connector',
      ].includes(currentTool)
    ) {
      createElementAtPoint(currentTool as WhiteboardElementType, pt);
      setCurrentTool('select');
      return;
    }

    // Clicking on blank background in select mode: start marquee selection box
    if (e.target === svgRef.current || (e.target as Element).id === 'board-canvas-bg') {
      if (!e.shiftKey) {
        setSelectedIds([]);
      }
      setIsMarqueeSelecting(true);
      setMarqueeStart(pt);
      setMarqueeCurrent(pt);

      if (editingElementId) {
        finishTextEdit();
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // Canvas Pan
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const pt = getCanvasCoordinates(e);

    // Laser Pointer
    if (isLaserDrawing && currentTool === 'laser') {
      setLaserPoints((prev) => [...prev, { x: pt.x, y: pt.y, time: Date.now() }]);
      return;
    }

    // Freehand Pencil / Marker
    if (isFreehandDrawing) {
      setCurrentFreehandPoints((prev) => [...prev, pt]);
      return;
    }

    // Marquee Box Selection
    if (isMarqueeSelecting) {
      setMarqueeCurrent(pt);
      const minX = Math.min(marqueeStart.x, pt.x);
      const maxX = Math.max(marqueeStart.x, pt.x);
      const minY = Math.min(marqueeStart.y, pt.y);
      const maxY = Math.max(marqueeStart.y, pt.y);

      if (activeBoard) {
        const intersecting = activeBoard.elements.filter((el) => {
          if (el.hidden) return false;
          const box = getElementBoundingBox(el);
          return (
            box.minX < maxX &&
            box.maxX > minX &&
            box.minY < maxY &&
            box.maxY > minY
          );
        });
        setSelectedIds(intersecting.map((el) => el.id));
      }
      return;
    }

    // Rotating elements
    if (isRotating && selectedIds.length > 0 && activeBoard) {
      const radians = Math.atan2(pt.y - rotationCenter.y, pt.x - rotationCenter.x);
      let degrees = Math.round((radians * 180) / Math.PI) + 90;
      if (degrees < 0) degrees += 360;

      // Snap to 15-degree increments if Shift is held
      if (e.shiftKey) {
        degrees = Math.round(degrees / 15) * 15;
      }

      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? {
                ...b,
                elements: b.elements.map((el) =>
                  selectedIds.includes(el.id) ? { ...el, rotation: degrees } : el
                ),
              }
            : b
        )
      );
      return;
    }

    // Resizing element(s)
    if (activeResizeHandle && resizeStartBox && selectedIds.length === 1 && activeBoard) {
      const elId = selectedIds[0];
      const targetEl = activeBoard.elements.find((el) => el.id === elId);
      if (!targetEl || targetEl.locked) return;

      const deltaX = pt.x - dragStartPoint.x;
      const deltaY = pt.y - dragStartPoint.y;

      let newX = resizeStartBox.x;
      let newY = resizeStartBox.y;
      let newW = resizeStartBox.width;
      let newH = resizeStartBox.height;

      // Calculate new bounds based on handle
      if (activeResizeHandle.includes('e')) newW = resizeStartBox.width + deltaX;
      if (activeResizeHandle.includes('w')) {
        newW = resizeStartBox.width - deltaX;
        newX = resizeStartBox.x + deltaX;
      }
      if (activeResizeHandle.includes('s')) newH = resizeStartBox.height + deltaY;
      if (activeResizeHandle.includes('n')) {
        newH = resizeStartBox.height - deltaY;
        newY = resizeStartBox.y + deltaY;
      }

      // Constrain aspect ratio if Shift is pressed
      if (e.shiftKey && resizeStartBox.width > 0 && resizeStartBox.height > 0) {
        const aspect = resizeStartBox.width / resizeStartBox.height;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newH = newW / aspect;
        } else {
          newW = newH * aspect;
        }
      }

      // Enforce minimum dimensions
      newW = Math.max(newW, 20);
      newH = Math.max(newH, 20);

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
        newW = Math.round(newW / 20) * 20;
        newH = Math.round(newH / 20) * 20;
      }

      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? {
                ...b,
                elements: b.elements.map((el) =>
                  el.id === elId
                    ? {
                        ...el,
                        x: Math.round(newX),
                        y: Math.round(newY),
                        width: Math.round(newW),
                        height: Math.round(newH),
                      }
                    : el
                ),
              }
            : b
        )
      );
      return;
    }

    // Dragging selected elements
    if (isDraggingElements && selectedIds.length > 0 && activeBoard) {
      let deltaX = pt.x - dragStartPoint.x;
      let deltaY = pt.y - dragStartPoint.y;

      // Smart Alignment Guides computation
      const movingElements = activeBoard.elements.filter((el) => selectedIds.includes(el.id) && !el.locked);
      const otherElements = activeBoard.elements.filter((el) => !selectedIds.includes(el.id) && !el.hidden);

      const movingBBox = getCombinedBoundingBox(movingElements);
      if (movingBBox && otherElements.length > 0 && !snapToGrid) {
        const previewBox = {
          ...movingBBox,
          minX: movingBBox.minX + deltaX,
          minY: movingBBox.minY + deltaY,
          maxX: movingBBox.maxX + deltaX,
          maxY: movingBBox.maxY + deltaY,
          centerX: movingBBox.centerX + deltaX,
          centerY: movingBBox.centerY + deltaY,
        };

        const { snappedX, snappedY, guides } = computeAlignmentGuides(previewBox, otherElements);
        setActiveGuides(guides);
        deltaX = snappedX - movingBBox.minX;
        deltaY = snappedY - movingBBox.minY;
      } else {
        setActiveGuides([]);
      }

      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? {
                ...b,
                elements: b.elements.map((el) => {
                  const initial = elementStartSnapshots.get(el.id);
                  if (initial && selectedIds.includes(el.id) && !el.locked) {
                    let targetX = initial.x + deltaX;
                    let targetY = initial.y + deltaY;
                    if (snapToGrid) {
                      const snapped = snapPointToGrid({ x: targetX, y: targetY });
                      targetX = snapped.x;
                      targetY = snapped.y;
                    }
                    return {
                      ...el,
                      x: Math.round(targetX),
                      y: Math.round(targetY),
                    };
                  }
                  return el;
                }),
              }
            : b
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isLaserDrawing) {
      setIsLaserDrawing(false);
    }

    if (isMarqueeSelecting) {
      setIsMarqueeSelecting(false);
    }

    if (isRotating) {
      setIsRotating(false);
      if (activeBoard) saveWhiteboardBoards(boards);
    }

    if (activeResizeHandle) {
      setActiveResizeHandle(null);
      setResizeStartBox(null);
      if (activeBoard) saveWhiteboardBoards(boards);
    }

    if (isDraggingElements) {
      setIsDraggingElements(false);
      setActiveGuides([]);
      if (activeBoard) saveWhiteboardBoards(boards);
    }

    // Finish Freehand Drawing stroke
    if (isFreehandDrawing && currentFreehandPoints.length > 1 && activeBoard) {
      setIsFreehandDrawing(false);
      const isMarker = currentTool === 'marker';

      const newElem: WhiteboardElement = {
        id: `${isMarker ? 'marker' : 'draw'}-${Date.now()}`,
        type: isMarker ? 'marker' : 'draw',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: 'none',
        stroke: isMarker ? '#fef08a' : activeStroke,
        strokeWidth: isMarker ? 14 : activeStrokeWidth || 3,
        opacity: isMarker ? 0.45 : 1,
        points: currentFreehandPoints,
        zIndex: activeBoard.elements.length + 1,
      };

      updateElements([...activeBoard.elements, newElem]);
      setCurrentFreehandPoints([]);
    }
  };

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom with wheel/pinch
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 3.5);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom centered on cursor
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      }
    } else {
      // Pan canvas
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  };

  // -------------------------------------------------------------
  // Element Click, Drag & Text Editing
  // -------------------------------------------------------------
  const handleElementMouseDown = (e: React.MouseEvent, el: WhiteboardElement) => {
    e.stopPropagation();

    // Eraser Tool
    if (currentTool === 'eraser') {
      if (!activeBoard) return;
      updateElements(activeBoard.elements.filter((item) => item.id !== el.id));
      setSelectedIds((prev) => prev.filter((id) => id !== el.id));
      return;
    }

    if (currentTool === 'hand' || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Shift+Click for multi-selection toggle
    if (e.shiftKey) {
      setSelectedIds((prev) =>
        prev.includes(el.id) ? prev.filter((id) => id !== el.id) : [...prev, el.id]
      );
    } else if (!selectedIds.includes(el.id)) {
      setSelectedIds([el.id]);
    }

    // Prepare dragging
    setIsDraggingElements(true);
    const pt = getCanvasCoordinates(e);
    setDragStartPoint(pt);

    // Save starting coordinates for all currently selected elements
    const startMap = new Map<string, Point>();
    if (activeBoard) {
      activeBoard.elements.forEach((item) => {
        if (selectedIds.includes(item.id) || item.id === el.id) {
          startMap.set(item.id, { x: item.x, y: item.y });
        }
      });
    }
    setElementStartSnapshots(startMap);
  };

  const handleElementDoubleClick = (e: React.MouseEvent, el: WhiteboardElement) => {
    e.stopPropagation();
    setEditingElementId(el.id);
    setEditingTextValue(el.text || '');
  };

  const finishTextEdit = () => {
    if (!editingElementId || !activeBoard) return;
    const newElements = activeBoard.elements.map((el) =>
      el.id === editingElementId ? { ...el, text: editingTextValue } : el
    );
    updateElements(newElements);
    setEditingElementId(null);
    setEditingTextValue('');
  };

  // Start Resizing Handle
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    if (selectedIds.length !== 1 || !activeBoard) return;
    const el = activeBoard.elements.find((item) => item.id === selectedIds[0]);
    if (!el || el.locked) return;

    setActiveResizeHandle(handle);
    setResizeStartBox({ x: el.x, y: el.y, width: el.width, height: el.height });
    setDragStartPoint(getCanvasCoordinates(e));
  };

  // Start Rotation Handle
  const handleRotationMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.length === 0 || !activeBoard) return;
    const selected = activeBoard.elements.filter((el) => selectedIds.includes(el.id));
    const bbox = getCombinedBoundingBox(selected);
    if (!bbox) return;

    setIsRotating(true);
    setRotationCenter({ x: bbox.centerX, y: bbox.centerY });
  };

  // -------------------------------------------------------------
  // Contextual Actions & Property Updates
  // -------------------------------------------------------------
  const handleUpdateSelectedProperty = (updates: Partial<WhiteboardElement>) => {
    if (!activeBoard || selectedIds.length === 0) return;
    const newElements = activeBoard.elements.map((el) =>
      selectedIds.includes(el.id) && !el.locked ? { ...el, ...updates } : el
    );
    updateElements(newElements);
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!activeBoard || selectedIds.length < 2) return;
    const aligned = alignElements(activeBoard.elements, selectedIds, type);
    updateElements(aligned);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (!activeBoard || selectedIds.length < 3) return;
    const distributed = distributeElements(activeBoard.elements, selectedIds, direction);
    updateElements(distributed);
  };

  const handleLayerOrder = (
    action: 'front' | 'forward' | 'backward' | 'back',
    targetId?: string
  ) => {
    if (!activeBoard) return;
    const idsToMove = targetId ? [targetId] : selectedIds;
    if (idsToMove.length === 0) return;

    const elements = [...activeBoard.elements];
    elements.sort((a, b) => a.zIndex - b.zIndex);

    if (action === 'front') {
      const maxZ = Math.max(...elements.map((e) => e.zIndex), 0);
      idsToMove.forEach((id, i) => {
        const el = elements.find((e) => e.id === id);
        if (el) el.zIndex = maxZ + i + 1;
      });
    } else if (action === 'back') {
      const minZ = Math.min(...elements.map((e) => e.zIndex), 0);
      idsToMove.forEach((id, i) => {
        const el = elements.find((e) => e.id === id);
        if (el) el.zIndex = minZ - (idsToMove.length - i);
      });
    } else if (action === 'forward') {
      idsToMove.forEach((id) => {
        const idx = elements.findIndex((e) => e.id === id);
        if (idx < elements.length - 1) {
          const temp = elements[idx].zIndex;
          elements[idx].zIndex = elements[idx + 1].zIndex;
          elements[idx + 1].zIndex = temp;
        }
      });
    } else if (action === 'backward') {
      idsToMove.forEach((id) => {
        const idx = elements.findIndex((e) => e.id === id);
        if (idx > 0) {
          const temp = elements[idx].zIndex;
          elements[idx].zIndex = elements[idx - 1].zIndex;
          elements[idx - 1].zIndex = temp;
        }
      });
    }

    updateElements(elements);
  };

  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = `group-${Date.now()}`;
    handleUpdateSelectedProperty({ groupId: newGroupId });
  };

  const handleUngroup = () => {
    handleUpdateSelectedProperty({ groupId: undefined });
  };

  const handleDuplicate = () => {
    if (!activeBoard || selectedIds.length === 0) return;
    const duplicated: WhiteboardElement[] = [];

    activeBoard.elements.forEach((el) => {
      if (selectedIds.includes(el.id)) {
        duplicated.push({
          ...el,
          id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          x: el.x + 35,
          y: el.y + 35,
          zIndex: activeBoard.elements.length + duplicated.length + 1,
        });
      }
    });

    updateElements([...activeBoard.elements, ...duplicated]);
    setSelectedIds(duplicated.map((d) => d.id));
  };

  const handleDeleteSelected = () => {
    if (!activeBoard || selectedIds.length === 0) return;
    updateElements(activeBoard.elements.filter((el) => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  };

  const handleToggleLock = (targetId?: string) => {
    if (!activeBoard) return;
    const ids = targetId ? [targetId] : selectedIds;
    const isAllLocked = activeBoard.elements
      .filter((el) => ids.includes(el.id))
      .every((el) => el.locked);

    const updated = activeBoard.elements.map((el) =>
      ids.includes(el.id) ? { ...el, locked: !isAllLocked } : el
    );
    updateElements(updated);
  };

  const handleToggleHide = (targetId?: string) => {
    if (!activeBoard) return;
    const ids = targetId ? [targetId] : selectedIds;
    const isAllHidden = activeBoard.elements
      .filter((el) => ids.includes(el.id))
      .every((el) => el.hidden);

    const updated = activeBoard.elements.map((el) =>
      ids.includes(el.id) ? { ...el, hidden: !isAllHidden } : el
    );
    updateElements(updated);
  };

  const handleRenameElement = (id: string, newName: string) => {
    if (!activeBoard) return;
    updateElements(
      activeBoard.elements.map((el) => (el.id === id ? { ...el, name: newName } : el))
    );
  };

  const handleClearCanvas = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearCanvas = () => {
    updateElements([]);
    setSelectedIds([]);
    setIsClearConfirmOpen(false);
  };

  // Zoom to Fit Canvas
  const handleFitToScreen = () => {
    if (!activeBoard || activeBoard.elements.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const bbox = getCombinedBoundingBox(activeBoard.elements);
    if (!bbox) return;

    const padding = 80;
    const targetW = bbox.width + padding * 2;
    const targetH = bbox.height + padding * 2;

    const scaleX = canvasDimensions.width / targetW;
    const scaleY = canvasDimensions.height / targetH;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 2);

    const newPanX = canvasDimensions.width / 2 - bbox.centerX * newZoom;
    const newPanY = canvasDimensions.height / 2 - bbox.centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Import JSON Project
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && Array.isArray(parsed.elements)) {
          const newBoard: WhiteboardBoard = {
            id: `board-${Date.now()}`,
            name: parsed.name || file.name.replace('.json', ''),
            elements: parsed.elements,
            gridMode: parsed.gridMode || 'dots',
            bgColor: parsed.bgColor || '#ffffff',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const updated = [...boards, newBoard];
          setBoards(updated);
          setActiveId(newBoard.id);
          setActiveBoardId(newBoard.id);
          saveWhiteboardBoards(updated);
          setSelectedIds([]);
        }
      } catch (err) {
        console.error('Failed to parse whiteboard JSON file', err);
      }
    };
    reader.readAsText(file);
  };

  // Create New Board Modal Handler
  const handleConfirmCreateNewBoard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newBoardNameInput.trim() || `Board ${boards.length + 1}`;

    const newBoard: WhiteboardBoard = {
      id: `board-${Date.now()}`,
      name: title,
      elements: [],
      gridMode: 'dots',
      bgColor: '#ffffff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...boards, newBoard];
    setBoards(updated);
    setActiveId(newBoard.id);
    setActiveBoardId(newBoard.id);
    saveWhiteboardBoards(updated);
    setHistory([[]]);
    setIsNewBoardModalOpen(false);
    setSelectedIds([]);
  };

  // Rename current board
  const handleRenameBoard = (newName: string) => {
    if (!activeBoard) return;
    const updated = boards.map((b) => (b.id === activeBoard.id ? { ...b, name: newName } : b));
    setBoards(updated);
    saveWhiteboardBoards(updated);
  };

  // Selected Elements subset
  const selectedElements = useMemo(() => {
    if (!activeBoard) return [];
    return activeBoard.elements.filter((el) => selectedIds.includes(el.id));
  }, [activeBoard, selectedIds]);

  const selectedBoundingBox = useMemo(() => {
    return getCombinedBoundingBox(selectedElements);
  }, [selectedElements]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-neutral-100 dark:bg-neutral-950 select-none"
    >
      {/* Top Navigation Bar */}
      <WhiteboardTopNav
        activeBoard={activeBoard}
        boards={boards}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        saveStatus={saveStatus}
        showLayersPanel={showLayersPanel}
        onToggleLayersPanel={() => setShowLayersPanel(!showLayersPanel)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSelectBoard={(id) => {
          setActiveId(id);
          setActiveBoardId(id);
          setSelectedIds([]);
        }}
        onCreateNewBoard={() => {
          setNewBoardNameInput(`Board ${boards.length + 1}`);
          setIsNewBoardModalOpen(true);
        }}
        onRenameBoard={handleRenameBoard}
        onExportPNG={() => {
          if (svgRef.current && activeBoard) {
            exportBoardToPNG(svgRef.current, activeBoard.name, activeBoard.elements, activeBoard.bgColor);
          }
        }}
        onExportSVG={() => {
          if (svgRef.current && activeBoard) {
            exportBoardToSVG(svgRef.current, activeBoard.name, activeBoard.elements);
          }
        }}
        onExportPDF={() => {
          if (svgRef.current && activeBoard) {
            exportBoardToPDF(svgRef.current, activeBoard.name, activeBoard.elements, activeBoard.name, activeBoard.bgColor);
          }
        }}
        onExportJSON={() => {
          if (activeBoard) exportBoardToJSON(activeBoard);
        }}
        onImportJSON={handleImportJSON}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        gridMode={gridMode}
        onChangeGridMode={setGridMode}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Contextual Properties Inspector (Floating) */}
      <WhiteboardPropertiesPanel
        selectedElements={selectedElements}
        onUpdateProperty={handleUpdateSelectedProperty}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onLayerOrder={handleLayerOrder}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteSelected}
        onToggleLock={() => handleToggleLock()}
        onToggleHide={() => handleToggleHide()}
      />

      {/* Layers / Objects Panel (Toggleable) */}
      {showLayersPanel && activeBoard && (
        <WhiteboardLayersPanel
          elements={activeBoard.elements}
          selectedIds={selectedIds}
          onSelectElement={(id, isMulti) => {
            if (isMulti) {
              setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              );
            } else {
              setSelectedIds([id]);
            }
          }}
          onToggleLock={(id) => handleToggleLock(id)}
          onToggleHide={(id) => handleToggleHide(id)}
          onRenameElement={handleRenameElement}
          onDeleteElement={(id) => {
            updateElements(activeBoard.elements.filter((el) => el.id !== id));
            setSelectedIds((prev) => prev.filter((item) => item !== id));
          }}
          onLayerOrder={handleLayerOrder}
          onClose={() => setShowLayersPanel(false)}
        />
      )}

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block touch-none"
        style={{
          backgroundColor: activeBoard?.bgColor || '#ffffff',
          cursor:
            currentTool === 'hand' || isPanning || isSpacePressed
              ? 'grab'
              : currentTool === 'laser'
              ? 'crosshair'
              : currentTool === 'eraser'
              ? 'cell'
              : currentTool === 'select'
              ? 'default'
              : 'crosshair',
        }}
      >
        <defs>
          {/* Dot Grid Pattern */}
          <pattern id="dot-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.35)" />
          </pattern>

          {/* Line Grid Pattern */}
          <pattern id="line-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
          </pattern>

          {/* Arrow Head Markers */}
          <marker
            id="marker-arrow-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={activeStroke || '#0284c7'} />
          </marker>
          <marker
            id="marker-triangle-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <polygon points="0 0, 10 5, 0 10" fill={activeStroke || '#0284c7'} />
          </marker>
          <marker
            id="marker-dot-end"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
          >
            <circle cx="5" cy="5" r="4" fill={activeStroke || '#0284c7'} />
          </marker>
        </defs>

        {/* Infinite Grid Background */}
        <rect
          id="board-canvas-bg"
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={
            gridMode === 'lines'
              ? 'url(#line-grid-pattern)'
              : gridMode === 'dots'
              ? 'url(#dot-grid-pattern)'
              : 'transparent'
          }
        />

        {/* World Transform Layer (Pan & Zoom) */}
        <g id="board-world-layer" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Elements sorted by zIndex */}
          {activeBoard?.elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => {
              if (el.hidden) return null;
              const isSelected = selectedIds.includes(el.id);

              const strokeDasharray =
                el.strokeStyle === 'dashed'
                  ? '6 4'
                  : el.strokeStyle === 'dotted'
                  ? '2 3'
                  : undefined;

              const transformOrigin = `${el.x + el.width / 2}px ${el.y + el.height / 2}px`;
              const rotationTransform = el.rotation ? `rotate(${el.rotation})` : undefined;

              return (
                <g
                  key={el.id}
                  id={el.id}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  transform={rotationTransform}
                  style={{
                    transformOrigin,
                    opacity: el.opacity ?? 1,
                    cursor: el.locked ? 'not-allowed' : 'move',
                  }}
                  className="transition-opacity group"
                >
                  {/* Shape Rendering */}
                  {el.type === 'rectangle' && (
                    <rect
                      x={el.x}
                      y={el.y}
                      width={Math.max(el.width, 10)}
                      height={Math.max(el.height, 10)}
                      rx={el.cornerRadius || 0}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'rounded-rect' && (
                    <rect
                      x={el.x}
                      y={el.y}
                      width={Math.max(el.width, 10)}
                      height={Math.max(el.height, 10)}
                      rx={el.cornerRadius || 16}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'circle' && (
                    <ellipse
                      cx={el.x + el.width / 2}
                      cy={el.y + el.height / 2}
                      rx={Math.max(el.width / 2, 5)}
                      ry={Math.max(el.height / 2, 5)}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'triangle' && (
                    <polygon
                      points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'polygon' && (
                    <path
                      d={generateRegularPolygonPath(
                        el.x + el.width / 2,
                        el.y + el.height / 2,
                        6,
                        Math.min(el.width, el.height) / 2
                      )}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'star' && (
                    <path
                      d={generateStarPath(
                        el.x + el.width / 2,
                        el.y + el.height / 2,
                        5,
                        Math.min(el.width, el.height) / 2,
                        Math.min(el.width, el.height) / 4
                      )}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'diamond' && (
                    <polygon
                      points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height / 2} ${el.x + el.width / 2},${el.y + el.height} ${el.x},${el.y + el.height / 2}`}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'cylinder' && (
                    <g>
                      <path
                        d={`M ${el.x} ${el.y + 20}
                            C ${el.x} ${el.y + 35}, ${el.x + el.width} ${el.y + 35}, ${el.x + el.width} ${el.y + 20}
                            L ${el.x + el.width} ${el.y + el.height - 20}
                            C ${el.x + el.width} ${el.y + el.height}, ${el.x} ${el.y + el.height}, ${el.x} ${el.y + el.height - 20}
                            Z`}
                        fill={el.fill}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                      />
                      <ellipse
                        cx={el.x + el.width / 2}
                        cy={el.y + 20}
                        rx={el.width / 2}
                        ry={16}
                        fill={el.fill}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                      />
                    </g>
                  )}

                  {el.type === 'cloud' && (
                    <path
                      d={`M ${el.x + 40} ${el.y + el.height - 15}
                          h ${el.width - 70}
                          a 25 25 0 0 0 25 -25
                          a 20 20 0 0 0 -15 -18
                          a 35 35 0 0 0 -60 -15
                          a 30 30 0 0 0 -50 15
                          a 20 20 0 0 0 -15 20
                          a 25 25 0 0 0 25 23 z`}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                    />
                  )}

                  {el.type === 'sticky' && (
                    <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))">
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={6}
                        fill={el.fill}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                      />
                      {/* Realistic folded corner effect */}
                      <path
                        d={`M ${el.x + el.width - 24} ${el.y + el.height}
                            L ${el.x + el.width} ${el.y + el.height - 24}
                            L ${el.x + el.width - 24} ${el.y + el.height - 24} Z`}
                        fill="rgba(0, 0, 0, 0.12)"
                      />
                    </g>
                  )}

                  {el.type === 'frame' && (
                    <g>
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={12}
                        fill={el.fill || 'transparent'}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth || 2}
                        strokeDasharray="8 6"
                      />
                      {/* Frame Title Tab */}
                      <rect
                        x={el.x + 12}
                        y={el.y - 12}
                        width={Math.max((el.text?.length || 10) * 8 + 24, 100)}
                        height={24}
                        rx={6}
                        fill={el.stroke}
                      />
                      <text
                        x={el.x + 20}
                        y={el.y + 4}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                      >
                        {el.text || 'Frame / Section'}
                      </text>
                    </g>
                  )}

                  {el.type === 'comment' && (
                    <g filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.06))">
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={12}
                        fill={el.fill}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                      />
                      {/* Tail */}
                      <polygon
                        points={`${el.x + 20},${el.y + el.height} ${el.x + 32},${el.y + el.height} ${el.x + 14},${el.y + el.height + 12}`}
                        fill={el.fill}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                      />
                      <text
                        x={el.x + 12}
                        y={el.y + 18}
                        fontSize={10}
                        fontWeight="bold"
                        fill="#0284c7"
                        fontFamily="system-ui, sans-serif"
                      >
                        {el.commentAuthor || 'Reviewer'} &bull; {el.commentTime || 'Just now'}
                      </text>
                    </g>
                  )}

                  {el.type === 'line' && (
                    <line
                      x1={el.x}
                      y1={el.y}
                      x2={el.x + el.width}
                      y2={el.y + el.height}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                  )}

                  {el.type === 'arrow' && (
                    <line
                      x1={el.x}
                      y1={el.y}
                      x2={el.x + el.width}
                      y2={el.y + el.height}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                      markerEnd="url(#marker-arrow-end)"
                    />
                  )}

                  {el.type === 'connector' && (
                    <path
                      d={`M ${el.x} ${el.y}
                          C ${el.x + el.width / 2} ${el.y}, ${el.x + el.width / 2} ${el.y + el.height}, ${el.x + el.width} ${el.y + el.height}`}
                      fill="none"
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={strokeDasharray}
                      markerEnd="url(#marker-triangle-end)"
                    />
                  )}

                  {(el.type === 'draw' || el.type === 'marker') && el.points && (
                    <path
                      d={pointsToSmoothSvgPath(el.points)}
                      fill="none"
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {el.type === 'image' && el.imageSrc && (
                    <image
                      href={el.imageSrc}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      preserveAspectRatio="none"
                      className="rounded-lg"
                    />
                  )}

                  {el.type === 'icon' && el.iconName && (
                    <g transform={`translate(${el.x + el.width / 2 - 20}, ${el.y + el.height / 2 - 24})`}>
                      <WhiteboardIconRenderer
                        iconName={el.iconName}
                        size={40}
                        color={el.stroke || '#0284c7'}
                      />
                    </g>
                  )}

                  {/* Text Rendering inside element */}
                  {el.text && el.type !== 'frame' && (
                    <g pointerEvents="none">
                      {el.text.split('\n').map((line, lineIdx, lines) => {
                        const fontSize = el.fontSize || 13;
                        const lineHeight = fontSize * 1.35;
                        const totalHeight = lines.length * lineHeight;
                        const startY =
                          el.type === 'comment'
                            ? el.y + 36 + lineIdx * lineHeight
                            : el.type === 'sticky'
                            ? el.y + 30 + lineIdx * lineHeight
                            : el.type === 'icon'
                            ? el.y + el.height - 12
                            : el.y + el.height / 2 - totalHeight / 2 + (lineIdx + 0.8) * lineHeight;

                        const textAnchor =
                          el.textAlign === 'left' || el.type === 'sticky' || el.type === 'comment'
                            ? 'start'
                            : el.textAlign === 'right'
                            ? 'end'
                            : 'middle';

                        const textX =
                          textAnchor === 'start'
                            ? el.x + 16
                            : textAnchor === 'end'
                            ? el.x + el.width - 16
                            : el.x + el.width / 2;

                        return (
                          <text
                            key={lineIdx}
                            x={textX}
                            y={startY}
                            fill={el.textColor || '#0f172a'}
                            fontSize={fontSize}
                            fontFamily={el.fontFamily || 'system-ui, sans-serif'}
                            fontWeight={el.fontWeight || 'normal'}
                            fontStyle={el.fontStyle || 'normal'}
                            textDecoration={el.textDecoration || 'none'}
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                          >
                            {line}
                          </text>
                        );
                      })}
                    </g>
                  )}

                  {/* Inline Textarea Overlay when Editing */}
                  {editingElementId === el.id && (
                    <foreignObject
                      x={el.x + 4}
                      y={el.y + 4}
                      width={Math.max(el.width - 8, 140)}
                      height={Math.max(el.height - 8, 50)}
                      className="z-50"
                    >
                      <textarea
                        autoFocus
                        value={editingTextValue}
                        onChange={(e) => setEditingTextValue(e.target.value)}
                        onBlur={finishTextEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            finishTextEdit();
                          }
                        }}
                        className="w-full h-full p-2 text-xs bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-white rounded-lg border-2 border-sky-500 outline-none resize-none shadow-xl font-sans"
                        style={{ fontSize: `${el.fontSize || 13}px` }}
                      />
                    </foreignObject>
                  )}
                </g>
              );
            })}

          {/* Current Freehand Drawing Preview */}
          {isFreehandDrawing && currentFreehandPoints.length > 1 && (
            <path
              d={pointsToSmoothSvgPath(currentFreehandPoints)}
              fill="none"
              stroke={currentTool === 'marker' ? '#fef08a' : activeStroke}
              strokeWidth={currentTool === 'marker' ? 14 : activeStrokeWidth || 3}
              opacity={currentTool === 'marker' ? 0.45 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Laser Pointer Disappearing Neon Trail */}
          {laserPoints.length > 1 && (
            <g className="canvas-ui-overlay pointer-events-none">
              {laserPoints.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = laserPoints[idx - 1];
                const age = Date.now() - pt.time;
                const opacity = Math.max(1 - age / 1200, 0);

                return (
                  <line
                    key={idx}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#f43f5e"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeOpacity={opacity}
                    filter="drop-shadow(0px 0px 6px #f43f5e)"
                  />
                );
              })}
            </g>
          )}

          {/* Smart Alignment Guides */}
          {activeGuides.map((guide, idx) => (
            <line
              key={idx}
              x1={guide.type === 'vertical' ? guide.position : -10000}
              y1={guide.type === 'horizontal' ? guide.position : -10000}
              x2={guide.type === 'vertical' ? guide.position : 10000}
              y2={guide.type === 'horizontal' ? guide.position : 10000}
              stroke="#0ea5e9"
              strokeWidth={1}
              strokeDasharray="4 4"
              className="canvas-ui-overlay pointer-events-none"
            />
          ))}

          {/* Bounding Box & Transform Handles for Selection */}
          {selectedBoundingBox && selectedElements.length > 0 && !isPanning && (
            <g className="canvas-ui-overlay pointer-events-auto">
              {/* Outer selection border */}
              <rect
                x={selectedBoundingBox.minX - 4}
                y={selectedBoundingBox.minY - 4}
                width={selectedBoundingBox.width + 8}
                height={selectedBoundingBox.height + 8}
                fill="none"
                stroke="#0284c7"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                pointerEvents="none"
              />

              {/* Only show 8 resize handles & rotation stem when single element is selected and not locked */}
              {selectedElements.length === 1 && !selectedElements[0].locked && (
                <>
                  {/* Rotation Stem & Handle */}
                  <line
                    x1={selectedBoundingBox.centerX}
                    y1={selectedBoundingBox.minY - 4}
                    x2={selectedBoundingBox.centerX}
                    y2={selectedBoundingBox.minY - 24}
                    stroke="#0284c7"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={selectedBoundingBox.centerX}
                    cy={selectedBoundingBox.minY - 24}
                    r={5}
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth={2}
                    onMouseDown={handleRotationMouseDown}
                    className="cursor-crosshair hover:scale-125 transition-transform"
                  />

                  {/* 8 Bounding Box Resize Handles */}
                  {[
                    { handle: 'nw', x: selectedBoundingBox.minX - 5, y: selectedBoundingBox.minY - 5, cursor: 'nwse-resize' },
                    { handle: 'n', x: selectedBoundingBox.centerX - 4, y: selectedBoundingBox.minY - 5, cursor: 'ns-resize' },
                    { handle: 'ne', x: selectedBoundingBox.maxX - 3, y: selectedBoundingBox.minY - 5, cursor: 'nesw-resize' },
                    { handle: 'e', x: selectedBoundingBox.maxX - 3, y: selectedBoundingBox.centerY - 4, cursor: 'ew-resize' },
                    { handle: 'se', x: selectedBoundingBox.maxX - 3, y: selectedBoundingBox.maxY - 3, cursor: 'nwse-resize' },
                    { handle: 's', x: selectedBoundingBox.centerX - 4, y: selectedBoundingBox.maxY - 3, cursor: 'ns-resize' },
                    { handle: 'sw', x: selectedBoundingBox.minX - 5, y: selectedBoundingBox.maxY - 3, cursor: 'nesw-resize' },
                    { handle: 'w', x: selectedBoundingBox.minX - 5, y: selectedBoundingBox.centerY - 4, cursor: 'ew-resize' },
                  ].map((h) => (
                    <rect
                      key={h.handle}
                      x={h.x}
                      y={h.y}
                      width={8}
                      height={8}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth={1.5}
                      rx={2}
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, h.handle as ResizeHandle)}
                      style={{ cursor: h.cursor }}
                      className="hover:scale-125 transition-transform"
                    />
                  ))}
                </>
              )}
            </g>
          )}

          {/* Marquee Selection Rectangle */}
          {isMarqueeSelecting && (
            <rect
              x={Math.min(marqueeStart.x, marqueeCurrent.x)}
              y={Math.min(marqueeStart.y, marqueeCurrent.y)}
              width={Math.abs(marqueeCurrent.x - marqueeStart.x)}
              height={Math.abs(marqueeCurrent.y - marqueeStart.y)}
              fill="rgba(14, 165, 233, 0.12)"
              stroke="#0284c7"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              className="canvas-ui-overlay pointer-events-none"
            />
          )}
        </g>
      </svg>

      {/* Main Floating Toolbar */}
      <WhiteboardToolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        hasSelection={selectedIds.length > 0}
        onDeleteSelected={handleDeleteSelected}
        onClearCanvas={handleClearCanvas}
        onImageUpload={handleImageUpload}
        onOpenIconModal={() => setIsIconModalOpen(true)}
      />

      {/* Floating Zoom Navigation Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl text-neutral-800 dark:text-neutral-200">
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.2))}
          className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Zoom Out (Ctrl/⌘ -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="text-xs font-mono font-bold w-12 text-center hover:text-sky-500 transition cursor-pointer"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 3.5))}
          className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Zoom In (Ctrl/⌘ +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        <button
          onClick={handleFitToScreen}
          className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Minimap */}
      {showMinimap && activeBoard && (
        <WhiteboardMinimap
          elements={activeBoard.elements}
          pan={pan}
          zoom={zoom}
          containerWidth={canvasDimensions.width}
          containerHeight={canvasDimensions.height}
          onPanChange={setPan}
          onClose={() => setShowMinimap(false)}
        />
      )}

      {/* Tech & UX Icon Library Modal */}
      {isIconModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Icon Library & Architecture Stamps
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select an icon to stamp directly into your diagram
                </p>
              </div>
              <button
                onClick={() => setIsIconModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search 50+ architecture, cloud, UI icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {ICON_CATEGORIES.map((cat) => {
                const filtered = cat.icons.filter((name) =>
                  name.toLowerCase().includes(iconSearch.toLowerCase())
                );
                if (filtered.length === 0) return null;

                return (
                  <div key={cat.name} className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {cat.name}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {filtered.map((iconName) => (
                        <button
                          key={iconName}
                          onClick={() => handleAddIcon(iconName)}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-neutral-700 dark:text-neutral-200 transition group cursor-pointer"
                        >
                          <WhiteboardIconRenderer
                            iconName={iconName}
                            size={24}
                            className="group-hover:text-sky-500 transition-colors"
                          />
                          <span className="text-[10px] font-medium mt-2 truncate w-full text-center">
                            {iconName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create New Board Modal */}
      {isNewBoardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Create New Whiteboard
              </h3>
              <button
                onClick={() => setIsNewBoardModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmCreateNewBoard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Board Title
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newBoardNameInput}
                  onChange={(e) => setNewBoardNameInput(e.target.value)}
                  placeholder="e.g. Microservices Architecture"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-sky-500 transition"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition cursor-pointer shadow-xs"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Canvas Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Clear Entire Whiteboard?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This will remove all shapes, connectors, and drawings from &ldquo;
                {activeBoard?.name}&rdquo;. You can still use Undo (Ctrl/⌘+Z) to restore.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCanvas}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      <WhiteboardHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Share & Transfer Modal */}
      <WhiteboardShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        board={activeBoard}
      />
    </div>
  );
};
