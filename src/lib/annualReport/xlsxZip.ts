const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const STORED_COMPRESSION_METHOD = 0;
const DOS_DATE_1980_01_01 = 33;
const ZIP_VERSION = 20;
const UINT16_MAX = 0xffff;
const UINT32_MAX = 0xffffffff;
const CRC32_POLYNOMIAL = 0xedb88320;

export type XlsxZipEntry = {
  data: Uint8Array;
  name: string;
};

const crc32Table = createCrc32Table();

export function readStoredZipEntries(bytes: Uint8Array): XlsxZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOfCentralDirectoryOffset = findEndOfCentralDirectoryOffset(view);
  const entryCount = view.getUint16(endOfCentralDirectoryOffset + 10, true);
  let centralDirectoryOffset = view.getUint32(endOfCentralDirectoryOffset + 16, true);
  const entries: XlsxZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(centralDirectoryOffset, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid XLSX central directory.");
    }

    const compressionMethod = view.getUint16(centralDirectoryOffset + 10, true);
    const compressedSize = view.getUint32(centralDirectoryOffset + 20, true);
    const fileNameLength = view.getUint16(centralDirectoryOffset + 28, true);
    const extraFieldLength = view.getUint16(centralDirectoryOffset + 30, true);
    const fileCommentLength = view.getUint16(centralDirectoryOffset + 32, true);
    const localHeaderOffset = view.getUint32(centralDirectoryOffset + 42, true);
    const name = decodeUtf8(
      bytes.subarray(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + fileNameLength),
    );

    if (compressionMethod !== STORED_COMPRESSION_METHOD) {
      throw new Error("Only uncompressed XLSX entries can be patched.");
    }

    const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraFieldLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    entries.push({
      data: bytes.slice(dataStart, dataStart + compressedSize),
      name,
    });

    centralDirectoryOffset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

export function writeStoredZipEntries(entries: XlsxZipEntry[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const crc32 = calculateCrc32(entry.data);
    const localHeader = createLocalFileHeader(nameBytes, entry.data, crc32);
    const centralHeader = createCentralDirectoryHeader(nameBytes, entry.data, crc32, offset);

    localParts.push(localHeader, entry.data);
    centralParts.push(centralHeader);
    offset += localHeader.byteLength + entry.data.byteLength;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  const endOfCentralDirectory = createEndOfCentralDirectory(
    entries.length,
    centralDirectorySize,
    centralDirectoryOffset,
  );

  return concatUint8Arrays([...localParts, ...centralParts, endOfCentralDirectory]);
}

export function decodeZipText(data: Uint8Array): string {
  return decodeUtf8(data);
}

export function encodeZipText(text: string): Uint8Array {
  return encodeUtf8(text);
}

function findEndOfCentralDirectoryOffset(view: DataView) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new Error("Invalid XLSX zip.");
}

function createLocalFileHeader(nameBytes: Uint8Array, data: Uint8Array, crc32: number): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, LOCAL_FILE_HEADER_SIGNATURE, true);
  view.setUint16(4, ZIP_VERSION, true);
  view.setUint16(8, STORED_COMPRESSION_METHOD, true);
  view.setUint16(12, DOS_DATE_1980_01_01, true);
  view.setUint32(14, crc32, true);
  view.setUint32(18, data.byteLength, true);
  view.setUint32(22, data.byteLength, true);
  view.setUint16(26, nameBytes.byteLength, true);
  header.set(nameBytes, 30);
  return header;
}

function createCentralDirectoryHeader(
  nameBytes: Uint8Array,
  data: Uint8Array,
  crc32: number,
  localHeaderOffset: number,
): Uint8Array {
  const header = new Uint8Array(46 + nameBytes.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, ZIP_VERSION, true);
  view.setUint16(6, ZIP_VERSION, true);
  view.setUint16(10, STORED_COMPRESSION_METHOD, true);
  view.setUint16(14, DOS_DATE_1980_01_01, true);
  view.setUint32(16, crc32, true);
  view.setUint32(20, data.byteLength, true);
  view.setUint32(24, data.byteLength, true);
  view.setUint16(28, nameBytes.byteLength, true);
  view.setUint32(42, localHeaderOffset, true);
  header.set(nameBytes, 46);
  return header;
}

function createEndOfCentralDirectory(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
): Uint8Array {
  if (
    entryCount > UINT16_MAX ||
    centralDirectorySize > UINT32_MAX ||
    centralDirectoryOffset > UINT32_MAX
  ) {
    throw new Error("XLSX zip is too large.");
  }

  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  return header;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = UINT32_MAX;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ byte) & 0xff];
  }
  return (crc ^ UINT32_MAX) >>> 0;
}

function createCrc32Table(): number[] {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? (value >>> 1) ^ CRC32_POLYNOMIAL : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }

  return result;
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return decodeURIComponent(escape(binary));
}

function encodeUtf8(text: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text);
  }

  const binary = unescape(encodeURIComponent(text));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
