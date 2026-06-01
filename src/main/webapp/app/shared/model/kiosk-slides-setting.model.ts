import { IAttachment } from 'app/shared/model/attachment.model';

export const KIOSK_SLIDE_TARGET_WIDTH = 1100;
export const KIOSK_SLIDE_TARGET_HEIGHT = 1350;
export const KIOSK_SLIDE_ASPECT_RATIO = KIOSK_SLIDE_TARGET_WIDTH / KIOSK_SLIDE_TARGET_HEIGHT;
export const KIOSK_SLIDE_ASPECT_TOLERANCE = 0.02;

export const KIOSK_SLIDE_MIN_SECONDS = 3;
export const KIOSK_SLIDE_MAX_SECONDS = 60;

export interface IKioskSlide {
  image?: IAttachment;
  displaySeconds?: number;
}

export interface IKioskSlidesSettingValue {
  slides?: IKioskSlide[];
}

export interface IKioskSlidesSettingRequest {
  branchId?: string;
  value?: IKioskSlidesSettingValue;
}

export interface IKioskSlidesSettingResponse {
  branchId?: string;
  value?: IKioskSlidesSettingValue;
  slides?: { imageUrl: string; displaySeconds: number }[];
}

export const defaultKioskSlidesSettingValue: Readonly<IKioskSlidesSettingValue> = {
  slides: [],
};

export const defaultKioskSlidesSettingResponse: Readonly<IKioskSlidesSettingResponse> = {
  value: defaultKioskSlidesSettingValue,
};

export function normalizeKioskSlidesSettingValue(value?: IKioskSlidesSettingValue | null): IKioskSlidesSettingValue {
  const slides = (value?.slides || []).map(slide => ({
    image: slide?.image,
    displaySeconds: clampDisplaySeconds(slide?.displaySeconds),
  }));
  return { slides };
}

export function clampDisplaySeconds(seconds?: number | null): number {
  const value = seconds ?? KIOSK_SLIDE_MIN_SECONDS;
  return Math.min(KIOSK_SLIDE_MAX_SECONDS, Math.max(KIOSK_SLIDE_MIN_SECONDS, value));
}

export function isKioskSlideAspectRatioValid(width: number, height: number): boolean {
  if (!width || !height) {
    return false;
  }
  const ratio = width / height;
  return Math.abs(ratio - KIOSK_SLIDE_ASPECT_RATIO) <= KIOSK_SLIDE_ASPECT_TOLERANCE;
}

export function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read image dimensions'));
    img.src = url;
  });
}
