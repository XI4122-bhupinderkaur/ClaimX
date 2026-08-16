import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLogin } from '../hooks/useAuth';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const rootNavigation = navigation.getParent() as
    | NativeStackNavigationProp<RootStackParamList>
    | undefined;
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const loginErrorMessage = useMemo(() => {
    if (!loginMutation.error) {
      return '';
    }

    if (loginMutation.error instanceof Error) {
      return loginMutation.error.message;
    }

    return 'Unable to log in. Please try again.';
  }, [loginMutation.error]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      rootNavigation?.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch {
      // Error is surfaced via the mutation error state.
    }
  };

  const handleForgotPassword = (): void => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>ClaimX</Text>
        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={text => {
            setEmail(text);
            if (emailError) {
              setEmailError('');
            }
          }}
          placeholder="name@example.com"
          style={[styles.input, emailError ? styles.inputError : null]}
          value={email}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={text => {
              setPassword(text);
              if (passwordError) {
                setPasswordError('');
              }
            }}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, passwordError ? styles.inputError : null]}
            value={password}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPassword(value => !value)}
            style={styles.passwordToggle}>
            <Text style={styles.passwordToggleText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleForgotPassword}
          style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>

        {loginErrorMessage ? (
          <Text style={styles.apiError}>{loginErrorMessage}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={loginMutation.isPending}
          onPress={handleLogin}
          style={[
            styles.loginButton,
            loginMutation.isPending ? styles.loginButtonDisabled : null,
          ]}>
          <Text style={styles.loginButtonText}>
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    color: '#1d4ed8',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  passwordContainer: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 4,
    paddingRight: 10,
  },
  passwordInput: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordToggle: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  passwordToggleText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  apiError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    color: '#991b1b',
    fontSize: 13,
    marginBottom: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 14,
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LoginScreen;
