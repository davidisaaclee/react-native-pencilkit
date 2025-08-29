import {
  codegenNativeComponent,
  codegenNativeCommands,
  type ViewProps,
  type HostComponent,
} from 'react-native';
import type {
  WithDefault,
  Double,
  DirectEventHandler,
} from 'react-native/Libraries/Types/CodegenTypesNamespace';

interface ScrollEvent {
  contentOffset: {
    x: Double;
    y: Double;
  };
  contentSize: {
    width: Double;
    height: Double;
  };
  zoomScale: Double;
}

interface ZoomEvent {
  contentOffset: {
    x: Double;
    y: Double;
  };
  contentSize: {
    width: Double;
    height: Double;
  };
  zoomScale: Double;
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

interface NativeProps extends ViewProps {
  drawingPolicy?: WithDefault<'default' | 'anyInput' | 'pencilOnly', 'default'>;
  drawingEnabled?: WithDefault<boolean, true>;
  minimumZoomScale: Double;
  maximumZoomScale: Double;
  contentSizeWidth: Double;
  contentSizeHeight: Double;
  onScroll?: DirectEventHandler<ScrollEvent>;
  onZoom?: DirectEventHandler<ZoomEvent>;
}

/** 6-element [a,b,c,d,tx,ty] */
type Transform2D = Double[];

interface Commands {
  transformDrawing: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    transform: Readonly<Transform2D>
  ) => void;
  clear: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  setToolPickerVisible: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    visible: boolean
  ) => void;
  loadDrawingData: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    base64Data: string
  ) => void;
  setViewport: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    contentOffsetX: Double,
    contentOffsetY: Double,
    zoomScale: Double
  ) => void;
  zoomToRect: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    originX: Double,
    originY: Double,
    sizeWidth: Double,
    sizeHeight: Double,
    animated: boolean
  ) => void;
}

export const Commands = codegenNativeCommands<Commands>({
  supportedCommands: [
    'setToolPickerVisible',
    'clear',
    'transformDrawing',
    'loadDrawingData',
    'setViewport',
    'zoomToRect',
  ],
});

export default codegenNativeComponent<NativeProps>('PencilkitView');
