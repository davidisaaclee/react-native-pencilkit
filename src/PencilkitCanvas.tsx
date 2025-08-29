import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { findNodeHandle } from 'react-native';
import NativePencilkitView, { Commands } from './PencilkitViewNativeComponent';
import Util from './NativePencilkitUtil';

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
  zoomToRect: (opts: {
    rect: { origin: [number, number]; size: [number, number] };
    animated?: boolean;
  }) => void;
  getDrawingBounds(): Promise<{
    origin: [number, number];
    size: [number, number];
  } | null>;
}


export const PencilkitCanvas = forwardRef<
  PencilkitCanvasMethods,
  PencilkitCanvasProps
>((props, forwardedRef) => {
  const nativeRef = useRef<ComponentRef<typeof NativePencilkitView>>(null);


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
    async requestDataUri() {
      if (nativeRef.current == null) {
        throw new Error('Native ref is null');
      }
      const handle = findNodeHandle(nativeRef.current);
      if (handle == null) {
        throw new Error('Unable to get native handle');
      }
      const result = await Util.requestDataUri(handle);
      if (result.success) {
        return {
          uri: result.uri!,
          frame: {
            origin: [result.frame!.x, result.frame!.y] as const,
            size: [result.frame!.width, result.frame!.height] as const,
          },
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    },
    async requestDrawingData() {
      if (nativeRef.current == null) {
        throw new Error('Native ref is null');
      }
      const handle = findNodeHandle(nativeRef.current);
      if (handle == null) {
        throw new Error('Unable to get native handle');
      }
      const result = await Util.requestDrawingData(handle);
      if (result.success) {
        return result.data!;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
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
      if (nativeRef.current == null) return null;
      const handle = findNodeHandle(nativeRef.current);
      if (handle == null) return null;
      const bounds = await Util.getDrawingBounds(handle);
      return {
        origin: [bounds.x, bounds.y] as const,
        size: [bounds.width, bounds.height] as const,
      };
    },
  }));

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
    />
  );
});
