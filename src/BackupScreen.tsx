import React, { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, FileMode, Paths } from 'expo-file-system';
import { MAX_BACKUP_FILE_BYTES } from './backupLimits';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  backupSummary,
  createBackup,
  MAX_BACKUP_CHARS,
  parseBackup,
  type BackupPreview,
} from './backup';
import type { Database } from './model';
import { colors as c } from './theme';
import { Button, PageHeader, s } from './ui';

const READ_CHUNK_BYTES = 64 * 1024;
const MAX_EXPORT_BACKUP_BYTES = 40_000_000;
const FILE_TOO_LARGE = 'O arquivo é grande demais para restaurar com segurança.';

function readAndroidBackup(uri: string): string {
  const handle = new File(uri).open(FileMode.ReadOnly);
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total <= MAX_BACKUP_FILE_BYTES) {
      const bytes = handle.readBytes(Math.min(READ_CHUNK_BYTES, MAX_BACKUP_FILE_BYTES + 1 - total));
      if (bytes.length === 0) break;
      total += bytes.length;
      if (total > MAX_BACKUP_FILE_BYTES) throw new Error(FILE_TOO_LARGE);
      chunks.push(bytes);
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(combined);
  } finally {
    handle.close();
  }
}

function countText(database: Database) {
  const count = backupSummary(database);
  return `${count.routines} ${count.routines === 1 ? 'rotina' : 'rotinas'} de força · ${count.workouts} ${count.workouts === 1 ? 'treino' : 'treinos'} no histórico · ${count.cardioRoutines} ${count.cardioRoutines === 1 ? 'cardio' : 'cardios'} · ${count.cardioHistory} ${count.cardioHistory === 1 ? 'cardio' : 'cardios'} no histórico · ${count.supplements} ${count.supplements === 1 ? 'suplemento' : 'suplementos'}${count.activeWorkout ? ' · treino em andamento' : ''}${count.activeCardio ? ' · cardio em andamento' : ''}`;
}

export function BackupScreen({
  database,
  restoring = false,
  onBack,
  onRestore,
}: {
  database: Database;
  restoring?: boolean;
  onBack: () => void;
  onRestore: (backup: BackupPreview) => void;
}) {
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setMessage('');
    setBusy(true);
    try {
      const contents = createBackup(database);
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `ritmo-backup-${date}`;
      if (Platform.OS === 'web') {
        const blob = new Blob([contents], { type: 'application/json' });
        if (blob.size > MAX_EXPORT_BACKUP_BYTES) throw new Error('O backup ficou grande demais.');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setMessage(
          'Download iniciado. Confirme que o arquivo JSON foi salvo antes de trocar de app.',
        );
      } else if (Platform.OS === 'android') {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) return;
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          fileName,
          'application/json',
        );
        try {
          await FileSystem.writeAsStringAsync(uri, contents);
          const check = await FileSystem.readAsStringAsync(uri);
          if (check !== contents) throw new Error('Não foi possível conferir o arquivo salvo.');
        } catch (error) {
          await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
          throw error;
        }
        setMessage(
          'Backup salvo e conferido na pasta escolhida. Copie o arquivo para fora do celular antes de desinstalar o app.',
        );
      } else {
        const file = new File(Paths.cache, `${fileName}.json`);
        file.create({ overwrite: true });
        file.write(contents);
        if (file.size > MAX_EXPORT_BACKUP_BYTES || (await file.text()) !== contents)
          throw new Error('Não foi possível conferir o arquivo salvo.');
        if (!(await Sharing.isAvailableAsync()))
          throw new Error('O compartilhamento de arquivos não está disponível.');
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
        setMessage('Confira se o arquivo foi salvo fora do app antes de desinstalá-lo.');
      }
    } catch (error) {
      setMessage((error as Error).message || 'Não foi possível exportar o backup.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseBackup() {
    setMessage('');
    setPreview(null);
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: Platform.OS !== 'android',
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_BACKUP_FILE_BYTES)
        throw new Error('O arquivo é grande demais para restaurar com segurança.');
      let contents: string;
      if (Platform.OS === 'web') {
        if (!asset.file) throw new Error('Não foi possível ler o arquivo escolhido.');
        if (asset.file.size > MAX_BACKUP_FILE_BYTES) throw new Error(FILE_TOO_LARGE);
        contents = await asset.file.text();
      } else if (Platform.OS === 'android') {
        contents = readAndroidBackup(asset.uri);
      } else {
        const file = new File(asset.uri);
        if (file.size > MAX_BACKUP_FILE_BYTES)
          throw new Error('O arquivo é grande demais para restaurar com segurança.');
        contents = await file.text();
      }
      if (contents.length > MAX_BACKUP_CHARS)
        throw new Error('O arquivo é grande demais para restaurar com segurança.');
      setPreview(parseBackup(contents));
    } catch (error) {
      setMessage((error as Error).message || 'Não foi possível abrir o backup.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <PageHeader
        title="Backup e restauração"
        subtitle="Guarde uma cópia completa dos seus dados."
        onBack={onBack}
      />
      <View style={s.card}>
        <Text style={s.cardTitle}>Dados neste aparelho</Text>
        <Text style={s.body}>{countText(database)}</Text>
        <Text style={s.small}>
          O arquivo inclui planejamento, histórico, sessões em andamento, peso e suplementos. É um
          JSON sem senha: guarde-o em local privado. O Ritmo não envia nem salva essa cópia
          automaticamente na nuvem.
        </Text>
        <Button
          label="Exportar backup para arquivo"
          icon="download"
          onPress={() => void exportBackup()}
          disabled={busy || restoring}
        />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Restaurar de um arquivo</Text>
        <Text style={s.small}>
          Escolha um backup exportado pelo Ritmo. O arquivo será conferido e mostrado antes de
          substituir os dados deste aparelho.
        </Text>
        <Button
          label="Escolher arquivo de backup"
          icon="upload"
          secondary
          onPress={() => void chooseBackup()}
          disabled={busy || restoring}
        />
        {preview && (
          <View style={[s.card, { backgroundColor: c.soft }]} testID="backup-preview">
            <Text style={s.eyebrow}>PRÉVIA · NADA FOI RESTAURADO</Text>
            <Text style={s.cardTitle}>
              Backup de {new Date(preview.exportedAt).toLocaleString('pt-BR')}
            </Text>
            <Text style={s.body}>{countText(preview.database)}</Text>
            <Text style={s.small}>
              Restaurar substitui todos os dados atuais. Confira se o arquivo é o correto.
            </Text>
            <Button
              label="Restaurar este backup"
              icon="rotate-ccw"
              danger
              onPress={() => onRestore(preview)}
              disabled={busy || restoring}
            />
          </View>
        )}
      </View>
      {restoring && (
        <Text accessibilityRole="alert" style={s.body}>
          Restaurando e conferindo os dados...
        </Text>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={s.body}>
          {message}
        </Text>
      )}
    </ScrollView>
  );
}
