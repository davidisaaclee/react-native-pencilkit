import { useRef, useState, type ComponentRef } from 'react';
import { View, StyleSheet, Button, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PencilkitView, Commands } from 'react-native-pencilkit';

export default function App() {
  const ref = useRef<ComponentRef<typeof PencilkitView>>(null);
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [savedDrawingData, setSavedDrawingData] = useState<string | null>(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Image
          source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={{ padding: 8 }}>
          <Button
            title="Clear"
            onPress={() => {
              Commands.clear(ref.current!);
            }}
          />
          <Button
            title="Focus"
            onPress={() => {
              Commands.setToolPickerVisible(ref.current!, true);
            }}
          />
          <Button
            title="Blur"
            onPress={() => {
              Commands.setToolPickerVisible(ref.current!, false);
            }}
          />
          <Button
            title="Rotate"
            onPress={() => {
              // rotate by 45 degrees
              Commands.transformDrawing(
                ref.current!,
                [0.707, 0.707, -0.707, 0.707, 0, 0]
              );
            }}
          />
          <Button
            title="Export Image"
            onPress={() => {
              Commands.requestDataUri(ref.current!);
            }}
          />
          <Button
            title="Save Drawing"
            onPress={() => {
              Commands.requestDrawingData(ref.current!);
            }}
          />
          <Button
            title="Load Drawing"
            disabled={!savedDrawingData}
            onPress={() => {
              if (savedDrawingData) {
                Commands.loadDrawingData(ref.current!, savedDrawingData);
                setExportedImage(null);
              }
            }}
          />
        </View>
        <PencilkitView
          ref={ref}
          style={{ flex: 1, margin: 20 }}
          onZoom={(e) => {
            console.log('Zoom event', e.nativeEvent);
          }}
          onScroll={(e) => {
            console.log('Scroll event', e.nativeEvent);
          }}
          onDataUri={(e) => {
            const result = e.nativeEvent;
            if (result.success) {
              console.log('Export successful:', result.uri);
              setExportedImage(result.uri);
            } else {
              console.error('Export failed:', result.error);
            }
          }}
          onDrawingData={(e) => {
            const result = e.nativeEvent;
            if (result.success) {
              console.log('Drawing data saved');
              setSavedDrawingData(result.data!);
            } else {
              console.error('Drawing data export failed:', result.error);
            }
          }}
          drawingPolicy="anyInput"
        />
        {exportedImage && (
          <Image
            source={{ uri: exportedImage }}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 100,
              height: 100,
              borderWidth: 2,
              borderColor: 'white',
            }}
            resizeMode="contain"
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
