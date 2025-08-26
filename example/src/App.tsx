import { View, StyleSheet } from 'react-native';
import { PencilkitView } from 'react-native-pencilkit';

export default function App() {
  return (
    <View style={styles.container}>
      <PencilkitView
        style={{ flex: 1, margin: 20, backgroundColor: 'white' }}
      />
    </View>
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
