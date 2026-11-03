import { BadRequestException } from '@nestjs/common';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

const startsWith = (buffer: Buffer, magic: number[]): boolean =>
  buffer.length >= magic.length && magic.every((byte, i) => buffer[i] === byte);

/**
 * Vérifie que le buffer correspond réellement à un JPEG ou un PNG
 * (le champ mimetype envoyé par le client n'est pas fiable).
 */
export function assertAllowedImage(file: UploadedFile): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new BadRequestException('Format accepté : JPEG ou PNG');
  }

  const isJpeg = startsWith(file.buffer, JPEG_MAGIC);
  const isPng = startsWith(file.buffer, PNG_MAGIC);

  if (!isJpeg && !isPng) {
    throw new BadRequestException('Le fichier ne correspond pas à une image JPEG ou PNG valide');
  }
}
