import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface RenderOutput {
  /** output file path */
  imagePath: string;
  width: number;
  height: number;
}

type PKDrawingHandle = number;

type Rect = { x: number; y: number; width: number; height: number };

export interface Spec extends TurboModule {
  /** @returns output file path */
  renderDrawingData(
    base64DrawingData: string,
    /** @default bounds of drawing */
    rect?: Rect,
    /** @default 1.0 */
    scale?: number,
    /** @default auto-generated unique path in app temporary dir */
    outFilePath?: string
  ): RenderOutput;

  pkDrawingFromData(base64DrawingData: string): PKDrawingHandle;
  pkDrawingBounds(handle: PKDrawingHandle): Rect;
  pkDrawingRelease(handle: PKDrawingHandle): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PencilKitModule');
