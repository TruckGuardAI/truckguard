import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  onPress: () => void;
};

export default function CreateAlertButton({
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.button}
      >
        <Text style={styles.text}>
          + Reportar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 90,

    zIndex: 999999,
    elevation: 999,

    pointerEvents: 'box-none',
  },

  button: {
    backgroundColor: '#ea580c',

    paddingHorizontal: 24,
    paddingVertical: 14,

    borderRadius: 30,

    minWidth: 150,

    alignItems: 'center',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.3,

    shadowRadius: 8,
  },

  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});