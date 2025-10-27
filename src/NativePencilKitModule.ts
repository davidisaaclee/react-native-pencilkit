import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  addTwo(n: number): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PencilKitModule');
