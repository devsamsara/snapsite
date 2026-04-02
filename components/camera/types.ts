export type EditorTool = 'crop' | 'draw' | 'adjust' | 'rotate';
export type EditorPhase = 'picker' | 'editor';
export type DrawMode = 'pen' | 'marker' | 'eraser';
export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

export interface DrawPath {
  id: string;
  path: string; // SVG path string
  color: string;
  strokeWidth: number;
  mode: DrawMode;
}

export interface CropRect {
  x: number; // 0–1 normalized
  y: number;
  width: number;
  height: number;
}

export interface Adjustments {
  brightness: number; // -1 to 1
  contrast: number;   // -1 to 1
  saturation: number; // -1 to 1
  warmth: number;     // -1 to 1
  sharpness: number;  // 0 to 1
}

export interface EditorState {
  imageUri: string | null;
  originalUri: string | null;
  phase: EditorPhase;
  activeTool: EditorTool;
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  cropRect: CropRect;
  adjustments: Adjustments;
  drawPaths: DrawPath[];
  drawColor: string;
  drawStrokeWidth: number;
  drawMode: DrawMode;
  aspectRatio: AspectRatio;
  isSaving: boolean;
  hasEdits: boolean;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
};

export const DEFAULT_CROP: CropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

export const DRAW_COLORS = [
  '#FFFFFF', '#000000', '#FF453A', '#FF9F0A',
  '#FFD60A', '#32D74B', '#64D2FF', '#0A84FF',
  '#BF5AF2', '#FF375F', '#AC8E68',
];

export const STROKE_WIDTHS = [3, 6, 12, 20];
