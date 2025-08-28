import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import NativePencilkitView, { Commands } from './PencilkitViewNativeComponent';

interface ScrollEvent {
  contentOffset: {
    x: number;
    y: number;
  };
  /**
   * NB: contentSize changes based on zoomScale (e.g. starting with a
   * contentSize of (1,1), then setting zoomScale=2 results in contentSize of
   * (2,2)) */
  contentSize: {
    width: number;
    height: number;
  };
  zoomScale: number;
}

export interface PencilkitCanvasProps {
  drawingPolicy: 'default' | 'anyInput' | 'pencilOnly';
  onScroll?: (event: ScrollEvent) => void;
  onZoom?: (event: ScrollEvent) => void;
  style?: StyleProp<ViewStyle>;
}

type Matrix2D = [number, number, number, number, number, number];

export interface PencilkitCanvasMethods {
  clear: () => void;
  setToolPickerVisible: (visible: boolean) => void;
  transformDrawing: (transform: Readonly<Matrix2D>) => void;
  requestDataUri: () => Promise<{
    uri: string;
    frame: { origin: [number, number]; size: [number, number] };
  }>;
  requestDrawingData: () => Promise<string>;
  loadDrawingData: (base64Data: string) => void;
  /** NB: Setting zoomScale by itself affects contentOffset, apparently zooming
   * from the center of the viewport. */
  setViewport: (opts: {
    contentOffset?: { x: number; y: number };
    zoomScale?: number;
  }) => void;
  zoomToRect: (rect: { origin: [number, number]; size: [number, number] }) => void;
}

type DataUriCompletionHandler = {
  resolve: (value: {
    uri: string;
    frame: { origin: [number, number]; size: [number, number] };
  }) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

type DrawingDataCompletionHandler = {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

export const PencilkitCanvas = forwardRef<
  PencilkitCanvasMethods,
  PencilkitCanvasProps
>((props, forwardedRef) => {
  const nativeRef = useRef<ComponentRef<typeof NativePencilkitView>>(null);
  const dataUriCompletionRef = useRef<DataUriCompletionHandler | null>(null);
  const drawingDataCompletionRef = useRef<DrawingDataCompletionHandler | null>(
    null
  );

  const handleDataUri = (e: any) => {
    const completion = dataUriCompletionRef.current;
    if (!completion) return;

    clearTimeout(completion.timeout);
    dataUriCompletionRef.current = null;

    const result = e.nativeEvent;
    if (result.success) {
      completion.resolve({
        uri: result.uri,
        frame: {
          origin: [result.frame.x, result.frame.y],
          size: [result.frame.width, result.frame.height],
        },
      });
    } else {
      completion.reject(new Error(result.error || 'Unknown error'));
    }
  };

  const handleDrawingData = (e: any) => {
    const completion = drawingDataCompletionRef.current;
    if (!completion) return;

    clearTimeout(completion.timeout);
    drawingDataCompletionRef.current = null;

    const result = e.nativeEvent;
    if (result.success) {
      completion.resolve(result.data);
    } else {
      completion.reject(new Error(result.error || 'Unknown error'));
    }
  };

  useImperativeHandle(forwardedRef, () => ({
    clear: () => {
      Commands.clear(nativeRef.current!);
    },
    setToolPickerVisible: (visible: boolean) => {
      Commands.setToolPickerVisible(nativeRef.current!, visible);
    },
    transformDrawing: (transform: Readonly<Matrix2D>) => {
      Commands.transformDrawing(nativeRef.current!, transform);
    },
    // TODO: react-native-pencil-kit achieves this without storing completion handlers by:
    // 1. defining a separate TurboModule of commands that return values (passing view ref as arg)
    // 2. using findNodeHandle on the React element's ref to get the native view ID
    // 3. calling the TurboModule command with the view ID and getting a Promise<value> back
    requestDataUri: () => {
      return new Promise((resolve, reject) => {
        if (dataUriCompletionRef.current) {
          reject(new Error('requestDataUri already in progress'));
          return;
        }

        const timeout = setTimeout(() => {
          dataUriCompletionRef.current = null;
          reject(new Error('requestDataUri timeout'));
        }, 10000);

        dataUriCompletionRef.current = { resolve, reject, timeout };
        Commands.requestDataUri(nativeRef.current!);
      });
    },
    requestDrawingData: () => {
      return new Promise((resolve, reject) => {
        if (drawingDataCompletionRef.current) {
          reject(new Error('requestDrawingData already in progress'));
          return;
        }

        const timeout = setTimeout(() => {
          drawingDataCompletionRef.current = null;
          reject(new Error('requestDrawingData timeout'));
        }, 10000);

        drawingDataCompletionRef.current = { resolve, reject, timeout };
        Commands.requestDrawingData(nativeRef.current!);
      });
    },
    loadDrawingData: (base64Data: string) => {
      Commands.loadDrawingData(nativeRef.current!, base64Data);
    },
    setViewport: (opts: {
      contentOffset?: { x: number; y: number };
      zoomScale?: number;
    }) => {
      Commands.setViewport(
        nativeRef.current!,
        opts.contentOffset?.x ?? NaN,
        opts.contentOffset?.y ?? NaN,
        opts.zoomScale ?? NaN
      );
    },
    zoomToRect: (rect: { origin: [number, number]; size: [number, number] }) => {
      Commands.zoomToRect(
        nativeRef.current!,
        rect.origin[0],
        rect.origin[1],
        rect.size[0],
        rect.size[1]
      );
    },
  }));

  return (
    <NativePencilkitView
      ref={nativeRef}
      style={props.style}
      drawingPolicy={props.drawingPolicy}
      onScroll={
        props.onScroll ? (e) => props.onScroll!(e.nativeEvent) : undefined
      }
      onZoom={props.onZoom ? (e) => props.onZoom!(e.nativeEvent) : undefined}
      onDataUri={handleDataUri}
      onDrawingData={handleDrawingData}
    />
  );
});
