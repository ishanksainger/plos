import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const PERSON_AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/**
 * Ensures the avatar upload directory exists on disk.
 */
export function ensureAvatarUploadDir(): void {
  if (!existsSync(PERSON_AVATAR_UPLOAD_DIR)) {
    mkdirSync(PERSON_AVATAR_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Multer disk storage for person avatar uploads (max 2 MB, images only).
 */
export const personAvatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureAvatarUploadDir();
    cb(null, PERSON_AVATAR_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const id = (req.params as { id?: string }).id ?? '0';
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `person-${id}-${Date.now()}${ext}`);
  },
});

/**
 * Rejects non-image uploads for person avatars.
 */
export function personAvatarFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new BadRequestException('Only JPEG, PNG, WebP, or GIF images are allowed'), false);
    return;
  }
  cb(null, true);
}
