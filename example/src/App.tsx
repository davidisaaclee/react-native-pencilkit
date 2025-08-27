import { useRef, useState, type ComponentRef } from 'react';
import { View, StyleSheet, Button, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PencilkitCanvas } from 'react-native-pencilkit';

export default function App() {
  const ref = useRef<ComponentRef<typeof PencilkitCanvas>>(null);
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
              ref.current?.clear();
            }}
          />
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
          <Button
            title="Rotate"
            onPress={() => {
              // rotate by 45 degrees
              ref.current?.transformDrawing([
                0.707, 0.707, -0.707, 0.707, 0, 0,
              ]);
            }}
          />
          <Button
            title="Export Image"
            onPress={async () => {
              try {
                const result = await ref.current?.requestDataUri();
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
        <PencilkitCanvas
          ref={ref}
          style={{ flex: 1, margin: 20 }}
          onZoom={(e) => {
            console.log('Zoom event', e);
          }}
          onScroll={(e) => {
            console.log('Scroll event', e);
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
