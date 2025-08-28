import { type TurboModule, TurboModuleRegistry } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypesNamespace';

interface Rect {
  x: Double;
  y: Double;
  width: Double;
  height: Double;
}

export interface Spec extends TurboModule {
  getDrawingBounds(viewId: Double): Promise<Rect>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNPencilKitUtil');
