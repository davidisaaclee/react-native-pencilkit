import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface RenderOutput {
  /** output file path */
  imagePath: string;
  width: number;
  height: number;
}

export interface Spec extends TurboModule {
  /** @returns output file path */
  renderDrawingData(
    base64DrawingData: string,
    /** @default bounds of drawing */
    rect?: { x: number; y: number; width: number; height: number },
    /** @default 1.0 */
    scale?: number,
    /** @default auto-generated unique path in app temporary dir */
    outFilePath?: string
  ): RenderOutput;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PencilKitModule');
