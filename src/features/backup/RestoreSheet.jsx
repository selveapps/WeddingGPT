import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import RestoreFilePicker from './RestoreFilePicker';
import RestorePreview from './RestorePreview';
import RestoreConfirm from './RestoreConfirm';
import ValidationResult from './ValidationResult';
import { validateBackupText } from '../backup/backupService';
import { validatePasteInput } from './lib/backupValidation';

/**
 * Multi-step restore flow in a modal sheet.
 * Props:
 *  - visible, onClose
 *  - onBackUp (optional pre-restore backup)
 *  - onRestore(checked) => void | Promise
 *  - canRestore (bool) – false when signed into synced workspace
 */
export default function RestoreSheet({ visible, onClose, onBackUp, onRestore, canRestore = true }) {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(null);
  const [step, setStep] = useState('pick'); // pick | preview | confirm | done
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setText('');
    setChecked(null);
    setStep('pick');
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onText = (value) => {
    setText(value);
    if (!value.trim()) {
      setChecked(null);
      return;
    }
    const input = validatePasteInput(value);
    if (!input.ok) {
      setChecked({ ok: false, error: input.errors[0] });
      return;
    }
    setChecked(validateBackupText(value));
  };

  const goPreview = () => {
    if (checked?.ok) setStep('preview');
  };

  const goConfirm = () => setStep('confirm');

  const doRestore = async () => {
    setBusy(true);
    try {
      await onRestore?.(checked);
      setStep('done');
    } catch (e) {
      setChecked({ ok: false, error: String(e?.message || e) });
      setStep('pick');
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Restore from a backup</Text>
          {!canRestore ? (
            <View style={styles.blocked}>
              <Text style={styles.blockedText}>
                This phone is showing your synced wedding. Sign out first, then restore a local plan here.
              </Text>
              <Pressable onPress={handleClose} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.body}>
              {step === 'pick' && (
                <>
                  <Text style={styles.sub}>The backup replaces everything planned on this phone.</Text>
                  <RestoreFilePicker text={text} onTextChange={onText} />
                  <ValidationResult checked={checked} />
                  <Pressable disabled={!checked?.ok} onPress={goPreview} style={[styles.btn, !checked?.ok && styles.disabled]}>
                    <Text style={styles.btnText}>Review backup</Text>
                  </Pressable>
                  {onBackUp ? (
                    <Pressable onPress={onBackUp} style={styles.link}>
                      <Text style={styles.linkText}>Back up current plan first</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
              {step === 'preview' && (
                <>
                  <RestorePreview checked={checked} />
                  <Pressable onPress={goConfirm} style={styles.btn}>
                    <Text style={styles.btnText}>Continue</Text>
                  </Pressable>
                  <Pressable onPress={() => setStep('pick')} style={styles.link}>
                    <Text style={styles.linkText}>Back</Text>
                  </Pressable>
                </>
              )}
              {step === 'confirm' && (
                <RestoreConfirm busy={busy} onConfirm={doRestore} onCancel={() => setStep('preview')} />
              )}
              {step === 'done' && (
                <View style={styles.done}>
                  <Text style={styles.doneEmoji}>✓</Text>
                  <Text style={styles.doneTitle}>Restore complete</Text>
                  <Pressable onPress={handleClose} style={styles.btn}>
                    <Text style={styles.btnText}>Done</Text>
                  </Pressable>
                </View>
              )}
              {step !== 'done' ? (
                <Pressable onPress={handleClose} style={styles.cancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FAF7F5', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 24 },
  handle: { width: 40, height: 4, backgroundColor: '#D6D3D1', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginVertical: 14 },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  sub: { fontSize: 14, color: '#6B5E5A', marginBottom: 16, lineHeight: 20 },
  btn: { backgroundColor: '#C93862', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btnSecondary: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnSecondaryText: { color: '#1A1A1A', fontWeight: '600' },
  disabled: { opacity: 0.4 },
  link: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#C93862', fontWeight: '600' },
  cancel: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#8A7E7A' },
  blocked: { padding: 20 },
  blockedText: { fontSize: 15, color: '#6B5E5A', lineHeight: 22 },
  done: { alignItems: 'center', paddingVertical: 24 },
  doneEmoji: { fontSize: 40, color: '#2D9F6F', marginBottom: 8 },
  doneTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
});
