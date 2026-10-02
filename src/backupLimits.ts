export const MAX_DATABASE_BYTES = 1_500_000;
export const MAX_BACKUP_FILE_BYTES = 8_000_000;

// AsyncStorage's Android backend stores the whole database in one SQLite row.
// Keep it below the approximately 2 MB CursorWindow limit on some devices.
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes++;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index++;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}

export function assertStorableDatabase(snapshot: string): void {
  if (utf8ByteLength(snapshot) > MAX_DATABASE_BYTES)
    throw new Error(
      'Os dados ultrapassam o limite seguro de armazenamento neste aparelho. Exporte um backup antes de reduzir registros antigos.',
    );
}
