import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import NativePencilkitView, { Commands } from './PencilkitViewNativeComponent';

const COMMAND_REQUEST_TIMEOUT_MS = 10000;

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
  minimumZoomScale?: number;
  maximumZoomScale?: number;
  contentSize?: readonly [number, number];
  drawingEnabled?: boolean;
  onScroll?: (event: ScrollEvent) => void;
  onZoom?: (event: ScrollEvent) => void;
  style?: StyleProp<ViewStyle>;
}

type Matrix2D = [number, number, number, number, number, number];

export interface PencilkitCanvasMethods {
  clear: () => void;
  setToolPickerVisible: (visible: boolean) => void;
  transformDrawing: (transform: Readonly<Matrix2D>) => void;
  renderImage: (opts?: Partial<{ renderScale: number }>) => Promise<{
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
  zoomToRect: (opts: {
    rect: { origin: [number, number]; size: [number, number] };
    animated?: boolean;
  }) => void;
  getDrawingBounds(): Promise<{
    origin: [number, number];
    size: [number, number];
  } | null>;
}

let nextTxnId = 1;

type PendingCommand = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

export const PencilkitCanvas = forwardRef<
  PencilkitCanvasMethods,
  PencilkitCanvasProps
>((props, forwardedRef) => {
  const nativeRef = useRef<ComponentRef<typeof NativePencilkitView>>(null);
  const pendingCommands = useRef<Map<number, PendingCommand>>(new Map());

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
    async renderImage(opts: Partial<{ renderScale: number }> = {}) {
      const { renderScale = 1 } = opts;
      return new Promise((resolve, reject) => {
        if (nativeRef.current == null) {
          reject(new Error('Native ref is null'));
          return;
        }

        const txnId = nextTxnId++;
        const timeout = setTimeout(() => {
          pendingCommands.current.delete(txnId);
          reject(new Error('renderImage timeout'));
        }, COMMAND_REQUEST_TIMEOUT_MS);

        pendingCommands.current.set(txnId, {
          resolve: (result) => {
            resolve({
              uri: result.uri!,
              frame: {
                origin: [result.frame!.x, result.frame!.y] as const,
                size: [result.frame!.width, result.frame!.height] as const,
              },
            });
          },
          reject,
          timeout,
        });

        Commands.requestDataUri(nativeRef.current!, txnId, renderScale);
      });
    },
    async requestDrawingData() {
      return new Promise<string>((resolve, reject) => {
        if (nativeRef.current == null) {
          reject(new Error('Native ref is null'));
          return;
        }

        const txnId = nextTxnId++;
        const timeout = setTimeout(() => {
          pendingCommands.current.delete(txnId);
          reject(new Error('requestDrawingData timeout'));
        }, COMMAND_REQUEST_TIMEOUT_MS);

        pendingCommands.current.set(txnId, {
          resolve: (result: string) => resolve(result),
          reject,
          timeout,
        });

        Commands.requestDrawingData(nativeRef.current!, txnId);
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
    zoomToRect: (opts: {
      rect: { origin: [number, number]; size: [number, number] };
      animated?: boolean;
    }) => {
      Commands.zoomToRect(
        nativeRef.current!,
        opts.rect.origin[0],
        opts.rect.origin[1],
        opts.rect.size[0],
        opts.rect.size[1],
        opts.animated ?? false
      );
    },

    async getDrawingBounds() {
      return new Promise<{
        origin: [number, number];
        size: [number, number];
      } | null>((resolve, reject) => {
        if (nativeRef.current == null) {
          resolve(null);
          return;
        }

        const txnId = nextTxnId++;
        const timeout = setTimeout(() => {
          pendingCommands.current.delete(txnId);
          reject(new Error('getDrawingBounds timeout'));
        }, COMMAND_REQUEST_TIMEOUT_MS);

        pendingCommands.current.set(txnId, {
          resolve: (bounds) => {
            resolve({
              origin: [bounds.x, bounds.y] as const,
              size: [bounds.width, bounds.height] as const,
            });
          },
          reject,
          timeout,
        });

        Commands.requestDrawingBounds(nativeRef.current!, txnId);
      });
    },
  }));

  const handleCommandResponse = (event: any) => {
    const response = event.nativeEvent;
    const pending = pendingCommands.current.get(response.txnId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingCommands.current.delete(response.txnId);

    if (response.type === 'drawingBounds') {
      pending.resolve(response.drawingBounds);
    } else if (response.type === 'dataUri') {
      if (response.dataUri?.success) {
        pending.resolve(response.dataUri);
      } else {
        pending.reject(new Error(response.dataUri?.error || 'Unknown error'));
      }
    } else if (response.type === 'drawingData') {
      if (response.drawingData?.success) {
        pending.resolve(response.drawingData.data);
      } else {
        pending.reject(
          new Error(response.drawingData?.error || 'Unknown error')
        );
      }
    }
  };

  return (
    <NativePencilkitView
      ref={nativeRef}
      style={props.style}
      drawingPolicy={props.drawingPolicy}
      drawingEnabled={props.drawingEnabled ?? true}
      contentSizeWidth={props.contentSize?.[0] ?? NaN}
      contentSizeHeight={props.contentSize?.[1] ?? NaN}
      minimumZoomScale={props.minimumZoomScale ?? NaN}
      maximumZoomScale={props.maximumZoomScale ?? NaN}
      onScroll={
        props.onScroll ? (e) => props.onScroll!(e.nativeEvent) : undefined
      }
      onZoom={props.onZoom ? (e) => props.onZoom!(e.nativeEvent) : undefined}
      onCommandResponse={handleCommandResponse}
    />
  );
});
