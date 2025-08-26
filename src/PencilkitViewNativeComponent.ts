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
  error?: string;
}

interface DrawingDataResult {
  success: boolean;
  data?: string;
  error?: string;
}

interface NativeProps extends ViewProps {
  drawingPolicy?: WithDefault<'default' | 'anyInput' | 'pencilOnly', 'default'>;
  onScroll?: DirectEventHandler<ScrollEvent>;
  onZoom?: DirectEventHandler<ZoomEvent>;
  onDataUri?: DirectEventHandler<ExportResult>;
  onDrawingData?: DirectEventHandler<DrawingDataResult>;
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
  requestDataUri: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>
  ) => void;
  requestDrawingData: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>
  ) => void;
  loadDrawingData: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    base64Data: string
  ) => void;
}

export const Commands = codegenNativeCommands<Commands>({
  supportedCommands: [
    'setToolPickerVisible',
    'clear',
    'transformDrawing',
    'requestDataUri',
    'requestDrawingData',
    'loadDrawingData',
  ],
});

export default codegenNativeComponent<NativeProps>('PencilkitView');
