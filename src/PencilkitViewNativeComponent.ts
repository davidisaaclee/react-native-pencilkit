import {
  codegenNativeComponent,
  codegenNativeCommands,
  type ViewProps,
  type HostComponent,
} from 'react-native';
import type {
  WithDefault,
  Double,
  Int32,
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

interface PKCommandResponse {
  txnId: Int32;
  type: 'drawingBounds' | 'dataUri' | 'drawingData';
  drawingBounds?: {
    x: Double;
    y: Double;
    width: Double;
    height: Double;
  };
  dataUri?: {
    success: boolean;
    uri?: string;
    frame?: {
      x: Double;
      y: Double;
      width: Double;
      height: Double;
    };
    error?: string;
  };
  drawingData?: {
    success: boolean;
    data?: string;
    error?: string;
  };
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
  onCommandResponse?: DirectEventHandler<PKCommandResponse>;
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
  requestDrawingBounds: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    txnId: Int32
  ) => void;
  requestDataUri: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    txnId: Int32,
    renderScale: Double
  ) => void;
  requestDrawingData: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    txnId: Int32
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
    'requestDrawingBounds',
    'requestDataUri',
    'requestDrawingData',
  ],
});

export default codegenNativeComponent<NativeProps>('PencilkitView');
