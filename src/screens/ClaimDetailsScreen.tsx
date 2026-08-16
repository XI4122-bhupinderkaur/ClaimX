import React, { useEffect, useMemo, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useClaim, useUpdateClaim } from '../hooks/useClaims';
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from '../hooks/useDocuments';
import { useFraudAssessment } from '../hooks/useFraud';
import { useCreatePayment, usePayments } from '../hooks/usePayments';
import type { MainStackParamList } from '../navigation/types';
import type { Claim, ClaimStatus } from '../types/claim';
import type { Document, DocumentType } from '../types/document';
import type { Payment, PaymentStatus } from '../types/payment';

type UpdateFormState = {
  policyId: string;
  customerId: string;
  claimNumber: string;
  status: ClaimStatus;
  incidentDate: string;
  description: string;
  claimAmount: number;
  approvedAmount?: number;
};

const statusColors: Record<ClaimStatus, { background: string; border: string; text: string }> = {
  SUBMITTED: { background: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  UNDER_REVIEW: { background: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  INVESTIGATION: { background: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  APPROVED: { background: '#dcfce7', border: '#86efac', text: '#166534' },
  REJECTED: { background: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  PAYMENT_PENDING: { background: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  PAID: { background: '#dcfce7', border: '#86efac', text: '#166534' },
  CLOSED: { background: '#e5e7eb', border: '#d1d5db', text: '#374151' },
};

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

const documentTypes: DocumentType[] = [
  'IDENTITY',
  'INVOICE',
  'POLICE_REPORT',
  'MEDICAL',
  'PHOTOGRAPH',
  'OTHER',
];

const paymentStatuses: PaymentStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

type PaymentFormState = {
  claimId: string;
  amount: string;
  status: PaymentStatus;
  transactionId: string;
};

const buildPaymentFormState = (claimId: string | undefined): PaymentFormState => ({
  claimId: claimId ?? '',
  amount: '',
  status: 'PENDING',
  transactionId: '',
});

const formatDate = (value?: string): string => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildFormState = (claim: Claim): UpdateFormState => ({
  policyId: claim.policyId,
  customerId: claim.customerId,
  claimNumber: claim.claimNumber,
  status: claim.status,
  incidentDate: claim.incidentDate,
  description: claim.description,
  claimAmount: claim.claimAmount,
  approvedAmount: claim.approvedAmount,
});

const ClaimDetailsScreen = (): React.JSX.Element => {
  const route = useRoute<RouteProp<MainStackParamList, 'ClaimDetails'>>();
  const claimId = route.params?.claimId;
  const { data, isLoading, error, refetch } = useClaim(claimId);
  const updateClaimMutation = useUpdateClaim();
  const documentsQuery = useDocuments(claimId);
  const uploadDocumentMutation = useUploadDocument();
  const deleteDocumentMutation = useDeleteDocument();
  const fraudQuery = useFraudAssessment(claimId);
  const paymentsQuery = usePayments();
  const createPaymentMutation = useCreatePayment();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UpdateFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UpdateFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(buildPaymentFormState(claimId));
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm(buildFormState(data));
    }
  }, [data]);

  useEffect(() => {
    setPaymentForm(buildPaymentFormState(claimId));
  }, [claimId]);

  const canEdit = useMemo(() => Boolean(data && claimId), [claimId, data]);
  const paymentsForClaim = useMemo<Payment[]>(() => {
    if (!paymentsQuery.data || !claimId) {
      return [];
    }

    return paymentsQuery.data.filter((payment: Payment) => payment.claimId === claimId);
  }, [claimId, paymentsQuery.data]);

  const updateField = <K extends keyof UpdateFormState>(field: K, value: UpdateFormState[K]): void => {
    setForm(current => (current ? { ...current, [field]: value } : current));
    setFieldErrors(current => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const validateForm = (currentForm: UpdateFormState): Partial<Record<keyof UpdateFormState, string>> => {
    const nextErrors: Partial<Record<keyof UpdateFormState, string>> = {};

    if (!currentForm.policyId.trim()) {
      nextErrors.policyId = 'Policy ID is required.';
    }

    if (!currentForm.customerId.trim()) {
      nextErrors.customerId = 'Customer ID is required.';
    }

    if (!currentForm.claimNumber.trim()) {
      nextErrors.claimNumber = 'Claim number is required.';
    }

    if (!currentForm.incidentDate.trim()) {
      nextErrors.incidentDate = 'Incident date is required.';
    }

    if (!currentForm.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (currentForm.claimAmount <= 0) {
      nextErrors.claimAmount = 'Claim amount must be greater than zero.';
    }

    if (currentForm.approvedAmount !== undefined && currentForm.approvedAmount < 0) {
      nextErrors.approvedAmount = 'Approved amount cannot be negative.';
    }

    return nextErrors;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!data || !form || !claimId) {
      return;
    }

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitError(null);

      await updateClaimMutation.mutateAsync({
        id: claimId,
        payload: {
          policyId: form.policyId,
          customerId: form.customerId,
          claimNumber: form.claimNumber,
          status: form.status,
          incidentDate: form.incidentDate,
          description: form.description,
          claimAmount: Number(form.claimAmount),
          approvedAmount:
            form.approvedAmount === undefined || Number(form.approvedAmount) === 0
              ? undefined
              : Number(form.approvedAmount),
        },
      });

      setIsEditing(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to update claim. Please try again.';

      setSubmitError(message);
    }
  };

  const cancelEditing = (): void => {
    if (data) {
      setForm(buildFormState(data));
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsEditing(false);
  };

  const handleUploadDocument = async (): Promise<void> => {
    if (!claimId) {
      return;
    }

    const nextType =
      documentTypes[(documentsQuery.data?.length ?? 0) % documentTypes.length] ?? 'OTHER';

    try {
      setUploadError(null);
      await uploadDocumentMutation.mutateAsync({
        claimId,
        request: {
          name: `Placeholder Document ${String((documentsQuery.data?.length ?? 0) + 1)}`,
          type: nextType,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Unable to upload document.';

      setUploadError(message.length > 0 ? 'Unable to upload document. Please try again.' : 'Unable to upload document. Please try again.');
    }
  };

  const handleDeleteDocument = async (documentId: string): Promise<void> => {
    if (!claimId || pendingDeleteId === documentId) {
      return;
    }

    Alert.alert('Delete document', 'This document will be removed from the claim.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setPendingDeleteId(documentId);
            setDeleteError(null);
            await deleteDocumentMutation.mutateAsync({ claimId, documentId });
          } catch {
            setDeleteError('Unable to delete document. Please try again.');
          } finally {
            setPendingDeleteId(null);
          }
        },
      },
    ]);
  };

  const handlePaymentChange = <K extends keyof PaymentFormState>(field: K, value: PaymentFormState[K]): void => {
    setPaymentForm(current => ({ ...current, [field]: value }));
    setPaymentError(null);
    setPaymentSuccess(null);
  };

  const handleCreatePayment = async (): Promise<void> => {
    if (!claimId || createPaymentMutation.isPending) {
      return;
    }

    const trimmedClaimId = paymentForm.claimId.trim();
    const trimmedTransactionId = paymentForm.transactionId.trim();
    const parsedAmount = Number(paymentForm.amount);

    if (!trimmedClaimId) {
      setPaymentError('Claim ID is required.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Amount must be greater than zero.');
      return;
    }

    if (!trimmedTransactionId) {
      setPaymentError('Transaction ID is required.');
      return;
    }

    const allowedStatuses: PaymentStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (!allowedStatuses.includes(paymentForm.status)) {
      setPaymentError('Status is invalid.');
      return;
    }

    try {
      setPaymentError(null);
      setPaymentSuccess(null);
      await createPaymentMutation.mutateAsync({
        claimId: trimmedClaimId,
        amount: parsedAmount,
        status: paymentForm.status,
        transactionId: trimmedTransactionId,
      });
      setPaymentSuccess('Payment created successfully.');
      setPaymentForm(buildPaymentFormState(claimId));
    } catch {
      setPaymentError('Unable to create payment. Please try again.');
    }
  };

  if (isLoading && !data) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Loading claim details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Unable to load claim</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!data || !form) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyTitle}>Claim not found</Text>
        <Text style={styles.emptyText}>The selected claim could not be loaded.</Text>
      </View>
    );
  }

  const statusStyle = statusColors[data.status] ?? statusColors.SUBMITTED;

  if (isEditing) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit claim</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Policy ID</Text>
            <TextInput
              accessibilityLabel="Policy ID"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={text => updateField('policyId', text)}
              style={[styles.input, fieldErrors.policyId ? styles.inputError : null]}
              value={form.policyId}
            />
            {fieldErrors.policyId ? <Text style={styles.errorText}>{fieldErrors.policyId}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Customer ID</Text>
            <TextInput
              accessibilityLabel="Customer ID"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={text => updateField('customerId', text)}
              style={[styles.input, fieldErrors.customerId ? styles.inputError : null]}
              value={form.customerId}
            />
            {fieldErrors.customerId ? <Text style={styles.errorText}>{fieldErrors.customerId}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Claim Number</Text>
            <TextInput
              accessibilityLabel="Claim Number"
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={text => updateField('claimNumber', text)}
              style={[styles.input, fieldErrors.claimNumber ? styles.inputError : null]}
              value={form.claimNumber}
            />
            {fieldErrors.claimNumber ? <Text style={styles.errorText}>{fieldErrors.claimNumber}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Status</Text>
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
            <Text style={styles.fieldLabel}>Incident Date</Text>
            <TextInput
              accessibilityLabel="Incident Date"
              onChangeText={text => updateField('incidentDate', text)}
              placeholder="YYYY-MM-DD"
              style={[styles.input, fieldErrors.incidentDate ? styles.inputError : null]}
              value={form.incidentDate}
            />
            {fieldErrors.incidentDate ? <Text style={styles.errorText}>{fieldErrors.incidentDate}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              accessibilityLabel="Description"
              multiline
              numberOfLines={4}
              onChangeText={text => updateField('description', text)}
              style={[styles.textArea, fieldErrors.description ? styles.inputError : null]}
              textAlignVertical="top"
              value={form.description}
            />
            {fieldErrors.description ? <Text style={styles.errorText}>{fieldErrors.description}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Claim Amount</Text>
            <TextInput
              accessibilityLabel="Claim Amount"
              keyboardType="decimal-pad"
              onChangeText={text => {
                const parsed = text === '' ? 0 : Number(text);
                updateField('claimAmount', Number.isFinite(parsed) ? parsed : 0);
              }}
              style={[styles.input, fieldErrors.claimAmount ? styles.inputError : null]}
              value={String(form.claimAmount)}
            />
            {fieldErrors.claimAmount ? <Text style={styles.errorText}>{fieldErrors.claimAmount}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Approved Amount</Text>
            <TextInput
              accessibilityLabel="Approved Amount"
              keyboardType="decimal-pad"
              onChangeText={text => {
                const parsed = text === '' ? undefined : Number(text);
                updateField('approvedAmount', Number.isFinite(parsed ?? 0) ? parsed : undefined);
              }}
              style={[styles.input, fieldErrors.approvedAmount ? styles.inputError : null]}
              value={form.approvedAmount === undefined ? '' : String(form.approvedAmount)}
            />
            {fieldErrors.approvedAmount ? <Text style={styles.errorText}>{fieldErrors.approvedAmount}</Text> : null}
          </View>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              disabled={updateClaimMutation.isPending}
              onPress={cancelEditing}
              style={[styles.secondaryButton, updateClaimMutation.isPending ? styles.disabledButton : null]}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={updateClaimMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
              style={[styles.primaryButton, updateClaimMutation.isPending ? styles.disabledButton : null]}>
              {updateClaimMutation.isPending ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Update Claim</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.claimNumber}>{data.claimNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusStyle.background,
              borderColor: statusStyle.border,
            },
          ]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{data.status}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Claim details</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Claim ID</Text>
          <Text style={styles.metaValue}>{data.id}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Policy ID</Text>
          <Text style={styles.metaValue}>{data.policyId}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Customer ID</Text>
          <Text style={styles.metaValue}>{data.customerId}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Claim amount</Text>
          <Text style={styles.metaValue}>${data.claimAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Approved amount</Text>
          <Text style={styles.metaValue}>${data.approvedAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Incident date</Text>
          <Text style={styles.metaValue}>{formatDate(data.incidentDate)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.metaValue}>{formatDate(data.createdAt)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Updated</Text>
          <Text style={styles.metaValue}>{formatDate(data.updatedAt)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{data.description}</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Fraud assessment</Text>
          {fraudQuery.data ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void fraudQuery.refetch();
              }}
              style={styles.smallActionButton}>
              <Text style={styles.smallActionButtonText}>Refresh</Text>
            </Pressable>
          ) : null}
        </View>

        {fraudQuery.isLoading ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator color="#1d4ed8" size="small" />
            <Text style={styles.inlineLoadingText}>Loading fraud assessment...</Text>
          </View>
        ) : null}

        {fraudQuery.error ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>Unable to load fraud assessment</Text>
            <Text style={styles.emptyStateText}>{fraudQuery.error.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void fraudQuery.refetch();
              }}
              style={styles.retryButtonSmall}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!fraudQuery.isLoading && !fraudQuery.error && (!fraudQuery.data || !fraudQuery.data.claimId) ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>No fraud assessment</Text>
            <Text style={styles.emptyStateText}>No fraud assessment is available for this claim yet.</Text>
          </View>
        ) : null}

        {fraudQuery.data ? (
          <View style={styles.fraudCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Claim ID</Text>
              <Text style={styles.metaValue}>{fraudQuery.data.claimId}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fraud score</Text>
              <Text style={styles.metaValue}>{String(fraudQuery.data.fraudScore)}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Risk level</Text>
              <Text style={styles.metaValue}>{fraudQuery.data.riskLevel}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{fraudQuery.data.status}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Risk factors</Text>
              <Text style={styles.metaValue}>
                {fraudQuery.data.riskFactors.length > 0 ? fraudQuery.data.riskFactors.join(', ') : 'None'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <Pressable
            accessibilityRole="button"
            disabled={paymentsQuery.isLoading || !claimId}
            onPress={() => {
              void paymentsQuery.refetch();
            }}
            style={[
              styles.smallActionButton,
              paymentsQuery.isLoading || !claimId ? styles.disabledButton : null,
            ]}>
            <Text style={styles.smallActionButtonText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.paymentFormCard}>
          <Text style={styles.fieldLabel}>Claim ID</Text>
          <TextInput
            accessibilityLabel="Payment Claim ID"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={text => handlePaymentChange('claimId', text)}
            style={styles.input}
            value={paymentForm.claimId}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput
              accessibilityLabel="Payment Amount"
              keyboardType="decimal-pad"
              onChangeText={text => handlePaymentChange('amount', text)}
              style={styles.input}
              value={paymentForm.amount}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.statusRow}>
              {paymentStatuses.map(status => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={paymentForm.status === status ? { selected: true } : { selected: false }}
                  key={status}
                  onPress={() => handlePaymentChange('status', status)}
                  style={[
                    styles.statusChip,
                    paymentForm.status === status ? styles.statusChipSelected : null,
                  ]}>
                  <Text
                    style={[
                      styles.statusChipText,
                      paymentForm.status === status ? styles.statusChipTextSelected : null,
                    ]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Transaction ID</Text>
            <TextInput
              accessibilityLabel="Payment Transaction ID"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={text => handlePaymentChange('transactionId', text)}
              style={styles.input}
              value={paymentForm.transactionId}
            />
          </View>

          {paymentError ? <Text style={styles.inlineError}>{paymentError}</Text> : null}
          {paymentSuccess ? <Text style={styles.successMessage}>{paymentSuccess}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={createPaymentMutation.isPending}
            onPress={() => {
              void handleCreatePayment();
            }}
            style={[styles.primaryButton, createPaymentMutation.isPending ? styles.disabledButton : null]}>
            <Text style={styles.primaryButtonText}>
              {createPaymentMutation.isPending ? 'Creating payment...' : 'Create Payment'}
            </Text>
          </Pressable>
        </View>

        {paymentsQuery.isLoading ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator color="#1d4ed8" size="small" />
            <Text style={styles.inlineLoadingText}>Loading payments...</Text>
          </View>
        ) : null}

        {paymentsQuery.error ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>Unable to load payments</Text>
            <Text style={styles.emptyStateText}>{paymentsQuery.error.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void paymentsQuery.refetch();
              }}
              style={styles.retryButtonSmall}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!paymentsQuery.isLoading && !paymentsQuery.error && paymentsForClaim.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>No payments found</Text>
            <Text style={styles.emptyStateText}>This claim does not have any payments yet.</Text>
          </View>
        ) : null}

        {paymentsForClaim.length > 0
          ? paymentsForClaim.map((payment: Payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>ID</Text>
                  <Text style={styles.metaValue}>{payment.id}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Claim ID</Text>
                  <Text style={styles.metaValue}>{payment.claimId}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Amount</Text>
                  <Text style={styles.metaValue}>${payment.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={styles.metaValue}>{payment.status}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Transaction ID</Text>
                  <Text style={styles.metaValue}>{payment.transactionId}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Created</Text>
                  <Text style={styles.metaValue}>{formatDate(payment.createdAt)}</Text>
                </View>
              </View>
            ))
          : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <Pressable
            accessibilityRole="button"
            disabled={uploadDocumentMutation.isPending || !claimId}
            onPress={() => {
              void handleUploadDocument();
            }}
            style={[
              styles.smallActionButton,
              uploadDocumentMutation.isPending || !claimId ? styles.disabledButton : null,
            ]}>
            <Text style={styles.smallActionButtonText}>
              {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
            </Text>
          </Pressable>
        </View>

        {uploadError ? <Text style={styles.inlineError}>{uploadError}</Text> : null}
        {deleteError ? <Text style={styles.inlineError}>{deleteError}</Text> : null}

        {documentsQuery.isLoading ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator color="#1d4ed8" size="small" />
            <Text style={styles.inlineLoadingText}>Loading documents...</Text>
          </View>
        ) : null}

        {documentsQuery.error ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>Unable to load documents</Text>
            <Text style={styles.emptyStateText}>Please try again.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void documentsQuery.refetch();
              }}
              style={styles.retryButtonSmall}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!documentsQuery.isLoading && !documentsQuery.error && (!documentsQuery.data || documentsQuery.data.length === 0) ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>No documents uploaded</Text>
            <Text style={styles.emptyStateText}>This claim does not have any documents yet.</Text>
          </View>
        ) : null}

        {documentsQuery.data && documentsQuery.data.length > 0
          ? documentsQuery.data.map((document: Document) => (
              <View key={document.id} style={styles.documentCard}>
                <View style={styles.documentHeaderRow}>
                  <View style={styles.documentTextWrap}>
                    <Text style={styles.documentName}>{document.name}</Text>
                    <Text style={styles.documentMeta}>Type: {document.type}</Text>
                    <Text style={styles.documentMeta}>Uploaded: {formatDate(document.uploadedAt)}</Text>
                    <Text style={styles.documentMeta}>Status: {document.status}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete document ${document.name}`}
                    disabled={deleteDocumentMutation.isPending || pendingDeleteId === document.id}
                    onPress={() => {
                      void handleDeleteDocument(document.id);
                    }}
                    style={[
                      styles.deleteButton,
                      deleteDocumentMutation.isPending || pendingDeleteId === document.id
                        ? styles.disabledButton
                        : null,
                    ]}>
                    <Text style={styles.deleteButtonText}>
                      {pendingDeleteId === document.id ? 'Deleting...' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          : null}
      </View>

      {canEdit ? (
        <Pressable
          accessibilityRole="button"
          disabled={updateClaimMutation.isPending}
          onPress={() => setIsEditing(true)}
          style={[styles.primaryButton, updateClaimMutation.isPending ? styles.disabledButton : null]}>
          <Text style={styles.primaryButtonText}>Edit Claim</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f4f7fb',
    minHeight: '100%',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 24,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  claimNumber: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
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
    marginBottom: 8,
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
  },
  metaValue: {
    color: '#111827',
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  description: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  inlineLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  inlineLoadingText: {
    color: '#374151',
    fontSize: 13,
  },
  inlineError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#991b1b',
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyStateBox: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  paymentFormCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  paymentCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  fraudCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  emptyStateTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 12,
  },
  documentCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  documentHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  documentMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 2,
  },
  smallActionButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '700',
  },
  retryButtonSmall: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#111827',
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 6,
  },
  retryButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
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
  successMessage: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderRadius: 8,
    borderWidth: 1,
    color: '#166534',
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

export default ClaimDetailsScreen;
