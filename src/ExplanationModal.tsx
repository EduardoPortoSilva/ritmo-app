import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Button, IconButton, s } from './ui';
import { colors as c } from './theme';

export function ExplanationModal({
  title,
  children,
  onClose,
  testID,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  testID: string;
  footer?: React.ReactNode;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.modalOverlay, { padding: 16 }]}>
        <View
          accessibilityViewIsModal
          accessibilityLabel={title}
          testID={testID}
          style={[s.modalCard, { maxWidth: 480, maxHeight: '88%', padding: 0, gap: 0 }]}
        >
          <View
            style={[
              s.sectionHeader,
              { padding: 16, gap: 12, borderBottomWidth: 1, borderColor: c.line },
            ]}
          >
            <Text accessibilityRole="header" style={[s.sectionTitle, { flex: 1 }]}>
              {title}
            </Text>
            <IconButton name="x" label="Fechar explicação" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {children}
            {footer ?? <Button label="Entendi" onPress={onClose} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
