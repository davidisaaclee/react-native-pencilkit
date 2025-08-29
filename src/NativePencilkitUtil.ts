import { type TurboModule, TurboModuleRegistry } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypesNamespace';

interface Rect {
  x: Double;
  y: Double;
  width: Double;
  height: Double;
}

interface ExportResult {
  success: boolean;
  uri?: string;
  frame?: {
    x: Double;
    y: Double;
    width: Double;
    height: Double;
  };
  error?: string;
}

interface DrawingDataResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface Spec extends TurboModule {
  getDrawingBounds(viewId: Double): Promise<Rect>;
  requestDataUri(viewId: Double): Promise<ExportResult>;
  requestDrawingData(viewId: Double): Promise<DrawingDataResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNPencilKitUtil');
