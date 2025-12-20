import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  PencilkitCanvas,
  type PencilkitCanvasMethods,
  PencilKit,
} from 'react-native-pencilkit';

export default function App() {
  const ref = useRef<PencilkitCanvasMethods>(null);
  const mirrorRef = useRef<PencilkitCanvasMethods>(null);
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [savedDrawingData, setSavedDrawingData] = useState<string | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState(true);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [toolPickerFrame, setToolPickerFrame] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const canvasSize = useRef<[number, number] | null>(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Image
          source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View
          style={{ flex: 1, margin: 20 }}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            canvasSize.current = [width, height];
            console.log('Canvas measured:', width, height);
          }}
        >
          <PencilkitCanvas
            ref={ref}
            drawingEnabled={drawingEnabled}
            style={{ flex: 1 }}
            onZoom={(e) => {
              console.log('Zoom event', e);
            }}
            onScroll={(e) => {
              console.log('Scroll event', e);
            }}
            onToolPickerLayout={(e) => {
              console.log('Tool picker layout:', e.frame);
              setToolPickerFrame(e.frame);
            }}
            onDrawingChanged={(e) => {
              console.log(
                'Drawing changed, base64 length:',
                e.base64Data.length
              );
              mirrorRef.current?.loadDrawingData(e.base64Data);
            }}
            drawingPolicy="anyInput"
            minimumZoomScale={0.5}
            maximumZoomScale={5}
            contentSize={[500, 500]}
          />
        </View>

        <View
          style={{
            flex: 1,
            margin: 20,
            marginTop: 10,
            borderWidth: 2,
            borderColor: 'blue',
          }}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            console.log('Mirror canvas measured:', width, height);
          }}
        >
          <PencilkitCanvas
            ref={mirrorRef}
            drawingEnabled={false}
            style={{ flex: 1 }}
            drawingPolicy="anyInput"
            minimumZoomScale={0.5}
            maximumZoomScale={5}
            contentSize={[500, 500]}
          />
        </View>

        <ScrollView
          style={{
            backgroundColor: 'hsla(0, 0%, 0%, 0.8)',
            padding: 8,
            position: 'absolute',
            left: 0,
            top: 40,
            right: 0,
            borderColor: 'white',
            borderWidth: 1,
          }}
          horizontal
        >
          <Button
            title={`Toggle Drawing (${drawingEnabled ? 'enabled' : 'disabled'})`}
            onPress={() => setDrawingEnabled(!drawingEnabled)}
          />
          <Button
            title="Clear"
            onPress={() => {
              ref.current?.clear();
            }}
          />
          <Button
            title="Print drawing bounds"
            onPress={async () => {
              try {
                console.log(
                  'Requesting drawing data for bounds...',
                  ref.current
                );
                if (!ref.current) return;
                const data = await ref.current.requestDrawingData();
                const handle = PencilKit.pkDrawingFromData(data);
                const bounds = PencilKit.pkDrawingBounds(handle);
                PencilKit.pkDrawingRelease(handle);
                console.log('Drawing bounds:', bounds);
              } catch (error) {
                console.error('Failed to get drawing bounds:', error);
              }
            }}
          />
          <View>
            <Button
              title="Focus"
              onPress={() => {
                ref.current?.setToolPickerVisible(true);
              }}
            />
            <Button
              title="Blur"
              onPress={() => {
                ref.current?.setToolPickerVisible(false);
              }}
            />
          </View>
          <Button
            title="Rotate"
            onPress={() => {
              // rotate by 45 degrees
              ref.current?.transformDrawing([
                0.707, 0.707, -0.707, 0.707, 0, 0,
              ]);
            }}
          />
          <View>
            <Button
              title="Export Image"
              onPress={async () => {
                try {
                  const result = await ref.current?.renderImage({
                    renderScale: 2,
                  });
                  if (result) {
                    console.log('Export successful:', result.uri);
                    console.log('Drawing frame:', result.frame);
                    setExportedImage(result.uri);
                  }
                } catch (error) {
                  console.error('Export failed:', error);
                }
              }}
            />
            <Button
              title="Export Image (static)"
              onPress={async () => {
                try {
                  const data = await ref.current?.requestDrawingData();
                  if (data) {
                    console.log('got data, rendering...');
                    const renderResult = await PencilKit.renderDrawingData(
                      data
                      // { x: -6, y: 175, width: 100, height: 161 }
                      // undefined,
                      // undefined
                    );
                    console.log(
                      'rendered to',
                      renderResult.imagePath,
                      renderResult
                    );
                    setExportedImage(`file://${renderResult.imagePath}`);
                  }
                } catch (error) {
                  console.error('Export failed:', error);
                }
              }}
            />
            <Button
              title="Save Drawing"
              onPress={async () => {
                try {
                  const data = await ref.current?.requestDrawingData();
                  if (data) {
                    console.log('Drawing data saved');
                    setSavedDrawingData(data);
                  }
                } catch (error) {
                  console.error('Drawing data export failed:', error);
                }
              }}
            />
            <Button
              title="Load Drawing"
              disabled={!savedDrawingData}
              onPress={() => {
                if (savedDrawingData) {
                  ref.current?.loadDrawingData(savedDrawingData);
                  setExportedImage(null);
                }
              }}
            />
          </View>
          <View>
            <Button
              title="Set Viewport - Zoom 2x"
              onPress={() => {
                ref.current?.setViewport({
                  zoomScale: 2.0,
                });
              }}
            />
            <Button
              title="Set Viewport - Center"
              onPress={() => {
                ref.current?.setViewport({
                  contentOffset: { x: 100, y: 100 },
                });
              }}
            />
            <Button
              title="Set Viewport - Zoom & Center"
              onPress={() => {
                ref.current?.setViewport({
                  contentOffset: { x: 50, y: 50 },
                  zoomScale: 1.5,
                });
              }}
            />
            <Button
              title="Reset Viewport"
              onPress={() => {
                ref.current?.setViewport({
                  contentOffset: { x: 0, y: 0 },
                  zoomScale: 1.0,
                });
              }}
            />
          </View>
          <View>
            <Button
              title="Zoom to Small Rect"
              onPress={() => {
                console.log(
                  'zoom to small',
                  ref.current != null,
                  canvasSize.current
                );
                ref.current?.zoomToRect({
                  rect: {
                    origin: [0, 0],
                    size: canvasSize.current!.map((x) => x * 0.5) as [
                      number,
                      number,
                    ],
                  },
                });
              }}
            />
            <Button
              title="Zoom to Large Rect (Animated)"
              onPress={() => {
                ref.current?.zoomToRect({
                  rect: {
                    origin: [0, 0],
                    size: canvasSize.current!,
                  },
                  animated: true,
                });
              }}
            />
            <Button
              title="Get bounds"
              onPress={async () => {
                console.log('bounds', await ref.current?.getDrawingBounds());
              }}
            />
          </View>
        </ScrollView>
        {exportedImage && (
          <TouchableOpacity
            style={[
              {
                position: 'absolute',
                borderWidth: 2,
                borderColor: 'white',
                backgroundColor: 'black',
              },
              isImageFullscreen
                ? {
                    // top: 0,
                    // left: 0,
                    // right: 0,
                    // bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{ scale: 4 }],
                  }
                : {
                    bottom: 20,
                    right: 20,
                    width: 100,
                    height: 100,
                  },
            ]}
            onPress={() => setIsImageFullscreen(!isImageFullscreen)}
          >
            <Image
              source={{ uri: exportedImage }}
              style={{
                width: '180%',
                height: '180%',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {/* View positioned behind the tool picker */}
        {toolPickerFrame && (
          <View
            style={{
              position: 'absolute',
              left: toolPickerFrame.x,
              top: toolPickerFrame.y,
              width: toolPickerFrame.width,
              height: toolPickerFrame.height,
              backgroundColor: 'rgba(255, 0, 0, 0.3)', // Semi-transparent red
              borderWidth: 2,
              borderColor: 'red',
              borderStyle: 'dashed',
              pointerEvents: 'none', // Allow touches to pass through
            }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'orange',
  },
});
