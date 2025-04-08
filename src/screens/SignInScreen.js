import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { sendEmailVerification } from 'firebase/auth';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let valid = true;
    const newErrors = {};

    if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
  
    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
  
      if (!userCred.user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before signing in.',
          [
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  await sendEmailVerification(userCred.user);
                  Alert.alert('Verification Sent', 'Check your inbox again!');
                } catch (err) {
                  Alert.alert('Error', err.message);
                }
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        return;
      }
  
      // ✅ Navigate to the HomeTabs after login
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' }],
      });      
    } catch (error) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };   

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Text style={styles.heading}>Welcome Back 👋</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        error={!!errors.email}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry={!showPassword}
        error={!!errors.password}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <Button
        mode="contained"
        onPress={handleSignIn}
        loading={loading}
        style={styles.button}
      >
        Sign In
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('SignUpStepOne')}>
  <Text style={styles.linkText}>Don’t have an account? Sign up</Text>
</TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff'
  },
  heading: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2e7d32'
  },
  input: {
    marginBottom: 10, backgroundColor: '#f1f8e9'
  },
  error: {
    fontSize: 12, color: 'red', marginBottom: 10
  },
  button: {
    marginTop: 20, padding: 8, borderRadius: 8
  },
  linkText: {
    marginTop: 20, fontSize: 14, color: '#388e3c', textAlign: 'center'
  }
});
