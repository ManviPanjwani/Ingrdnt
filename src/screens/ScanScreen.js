import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const isFocused = useIsFocused();
  const hasHandled = useRef(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const handleProductFetch = async (barcode) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`);
      const result = await response.json();

      if (!result || result.status === 0 || !result.product || !result.product.product_name) {
        Alert.alert('❌ Not Found', 'No product found for this barcode.');
        setLoading(false);
        return;
      }

      const user = auth.currentUser;
      if (user) {
        const scanRef = collection(db, 'users', user.uid, 'scanHistory');
        await addDoc(scanRef, {
          name: result.product.product_name || 'Unnamed Product',
          image: result.product.image_front_url || '',
          code: result.code,
          scannedAt: serverTimestamp(),
        });
      }

      navigation.navigate('Result', { product: result.product });
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to fetch product data.');
    } finally {
      setLoading(false);
      hasHandled.current = false;
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    if (loading || hasHandled.current) return;
    hasHandled.current = true;
    setLoading(true);
    handleProductFetch(data);
  };

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) return Alert.alert('Enter barcode number');
    Keyboard.dismiss();
    setShowManualEntry(false);
    setLoading(true);
    handleProductFetch(manualBarcode.trim());
  };

  if (hasPermission === null) return <Text>Requesting permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {isFocused && !loading && !showManualEntry && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
        />
      )}

      {!showManualEntry && (
        <View style={styles.scanFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
      )}

      {/* Manual Entry Modal */}
      <Modal visible={showManualEntry} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.manualEntryModal}>
            <Text style={styles.manualTitle}>Enter Barcode</Text>
            <TextInput
              placeholder="Enter Barcode Manually"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              style={styles.textInput}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowManualEntry(false)}>
                <Ionicons name="close-circle" size={32} color="red" />
              </Pressable>
              <Pressable onPress={handleManualSubmit}>
                <Ionicons name="checkmark-circle" size={32} color="#4caf50" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Pressable
        style={styles.toggleButton}
        onPress={() => {
          setShowManualEntry(true);
          Keyboard.dismiss();
        }}
      >
        <Text style={styles.toggleText}>Enter Manually</Text>
      </Pressable>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginLeft: -FRAME_SIZE / 2,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4caf50',
    width: 30,
    height: 30,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4caf50',
    width: 30,
    height: 30,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4caf50',
    width: 30,
    height: 30,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4caf50',
    width: 30,
    height: 30,
    borderBottomRightRadius: 8,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 30,
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualEntryModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4caf50'
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
});
