import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCreateClaim } from '../hooks/useClaims';
import type { MainStackParamList } from '../navigation/types';
import type { CreateClaimRequest } from '../api/claimsApi';
import type { ClaimStatus } from '../types/claim';

const claimStatuses: ClaimStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INVESTIGATION',
  'APPROVED',
  'REJECTED',
  'PAYMENT_PENDING',
  'PAID',
  'CLOSED',
];

const emptyForm: CreateClaimRequest = {
  policyId: '',
  customerId: '',
  claimNumber: '',
  status: 'SUBMITTED',
  incidentDate: '',
  description: '',
  claimAmount: 0,
  approvedAmount: 0,
};

const CreateClaimScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const createClaimMutation = useCreateClaim();

  const [form, setForm] = useState<CreateClaimRequest>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateClaimRequest, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !createClaimMutation.isPending && !createClaimMutation.isSuccess,
    [createClaimMutation.isPending, createClaimMutation.isSuccess],
  );

  const updateField = <K extends keyof CreateClaimRequest>(field: K, value: CreateClaimRequest[K]): void => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const validate = (): Partial<Record<keyof CreateClaimRequest, string>> => {
    const nextErrors: Partial<Record<keyof CreateClaimRequest, string>> = {};

    if (!form.policyId.trim()) {
      nextErrors.policyId = 'Policy ID is required.';
    }

    if (!form.customerId.trim()) {
      nextErrors.customerId = 'Customer ID is required.';
    }

    if (!form.claimNumber.trim()) {
      nextErrors.claimNumber = 'Claim number is required.';
    }

    if (!form.incidentDate.trim()) {
      nextErrors.incidentDate = 'Incident date is required.';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (Number(form.claimAmount) <= 0) {
      nextErrors.claimAmount = 'Claim amount must be greater than zero.';
    }

    const approvedAmount = Number(form.approvedAmount ?? 0);
    if (form.approvedAmount !== undefined && form.approvedAmount !== null && approvedAmount < 0) {
      nextErrors.approvedAmount = 'Approved amount cannot be negative.';
    }

    return nextErrors;
  };

  const handleSubmit = async (): Promise<void> => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitError(null);
      const createdClaim = await createClaimMutation.mutateAsync({
        ...form,
        claimAmount: Number(form.claimAmount),
        approvedAmount: form.approvedAmount === undefined || form.approvedAmount === null || Number(form.approvedAmount) === 0 ? undefined : Number(form.approvedAmount),
      });

      if (createdClaim?.id) {
        navigation.navigate('ClaimDetails', { claimId: createdClaim.id });
        return;
      }

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Unable to create claim. Please try again.';
      setSubmitError(message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.title}>Create Claim</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Policy ID</Text>
            <TextInput
              accessibilityLabel="Policy ID"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={text => updateField('policyId', text)}
              placeholder="POL-1001"
              style={[styles.input, errors.policyId ? styles.inputError : null]}
              value={form.policyId}
            />
            {errors.policyId ? <Text style={styles.errorText}>{errors.policyId}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer ID</Text>
            <TextInput
              accessibilityLabel="Customer ID"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={text => updateField('customerId', text)}
              placeholder="CUST-1001"
              style={[styles.input, errors.customerId ? styles.inputError : null]}
              value={form.customerId}
            />
            {errors.customerId ? <Text style={styles.errorText}>{errors.customerId}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Claim Number</Text>
            <TextInput
              accessibilityLabel="Claim Number"
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={text => updateField('claimNumber', text)}
              placeholder="CLM-2026-001"
              style={[styles.input, errors.claimNumber ? styles.inputError : null]}
              value={form.claimNumber}
            />
            {errors.claimNumber ? <Text style={styles.errorText}>{errors.claimNumber}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {claimStatuses.map(status => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={form.status === status ? { selected: true } : { selected: false }}
                  key={status}
                  onPress={() => updateField('status', status)}
                  style={[
                    styles.statusChip,
                    form.status === status ? styles.statusChipSelected : null,
                  ]}>
                  <Text
                    style={[
                      styles.statusChipText,
                      form.status === status ? styles.statusChipTextSelected : null,
                    ]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Incident Date</Text>
            <TextInput
              accessibilityLabel="Incident Date"
              keyboardType="default"
              onChangeText={text => updateField('incidentDate', text)}
              placeholder="YYYY-MM-DD"
              style={[styles.input, errors.incidentDate ? styles.inputError : null]}
              value={form.incidentDate}
            />
            {errors.incidentDate ? <Text style={styles.errorText}>{errors.incidentDate}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              accessibilityLabel="Description"
              multiline
              numberOfLines={4}
              onChangeText={text => updateField('description', text)}
              placeholder="Describe the incident and loss details"
              style={[styles.textArea, errors.description ? styles.inputError : null]}
              textAlignVertical="top"
              value={form.description}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Claim Amount</Text>
            <TextInput
              accessibilityLabel="Claim Amount"
              keyboardType="decimal-pad"
              onChangeText={text => {
                const nextValue = text === '' ? 0 : Number(text);
                updateField('claimAmount', Number.isFinite(nextValue) ? nextValue : 0);
              }}
              placeholder="0.00"
              style={[styles.input, errors.claimAmount ? styles.inputError : null]}
              value={String(form.claimAmount)}
            />
            {errors.claimAmount ? <Text style={styles.errorText}>{errors.claimAmount}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Approved Amount (optional)</Text>
            <TextInput
              accessibilityLabel="Approved Amount"
              keyboardType="decimal-pad"
              onChangeText={text => {
                const nextValue = text === '' ? undefined : Number(text);
                updateField('approvedAmount', Number.isFinite(nextValue ?? 0) ? (nextValue ?? undefined) : undefined);
              }}
              placeholder="0.00"
              style={[styles.input, errors.approvedAmount ? styles.inputError : null]}
              value={form.approvedAmount === undefined ? '' : String(form.approvedAmount)}
            />
            {errors.approvedAmount ? <Text style={styles.errorText}>{errors.approvedAmount}</Text> : null}
          </View>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: createClaimMutation.isPending }}
            disabled={createClaimMutation.isPending}
            onPress={() => {
              void handleSubmit();
            }}
            style={[styles.submitButton, createClaimMutation.isPending ? styles.submitButtonDisabled : null]}>
            {createClaimMutation.isPending ? (
              <View style={styles.submitContent}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.submitButtonText}>Creating Claim...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Create Claim</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f4f7fb',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#111827',
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
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 14,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  statusChipText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusChipTextSelected: {
    color: '#1d4ed8',
  },
  submitError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#991b1b',
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreateClaimScreen;
