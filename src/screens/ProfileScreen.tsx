import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { User } from '../types/user';

const emptyProfile: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const ProfileScreen = (): React.JSX.Element => {
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setForm({
      firstName: profileQuery.data.firstName,
      lastName: profileQuery.data.lastName,
      email: profileQuery.data.email,
      phone: profileQuery.data.phone,
    });
  }, [profileQuery.data]);

  const updateField = (field: keyof typeof emptyProfile, value: string): void => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSave = async (): Promise<void> => {
    await updateProfileMutation.mutateAsync(form);
  };

  if (profileQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (profileQuery.error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>{profileQuery.data?.role ?? 'CUSTOMER'}</Text>

        <Text style={styles.label}>First name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={text => updateField('firstName', text)}
          style={styles.input}
          value={form.firstName}
        />

        <Text style={styles.label}>Last name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={text => updateField('lastName', text)}
          style={styles.input}
          value={form.lastName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={text => updateField('email', text)}
          style={styles.input}
          value={form.email}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="phone-pad"
          onChangeText={text => updateField('phone', text)}
          style={styles.input}
          value={form.phone}
        />

        <Pressable
          disabled={updateProfileMutation.isPending}
          onPress={handleSave}
          style={[styles.button, updateProfileMutation.isPending && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7fb',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  label: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
