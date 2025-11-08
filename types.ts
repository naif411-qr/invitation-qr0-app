export type UserRole = 'admin' | 'user' | 'scanner';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthenticatedUser {
    username: string;
    role: UserRole;
}

export type RsvpStatus = 'confirmed' | 'declined' | 'pending';

export interface Member {
  id: string;
  ticketNumber?: string; // Short number for barcode (e.g., "00001", "00002")
  name: string;
  phone: string;
  scanLimit: number;
  scanCount: number;
  groupId: string;
  rsvpStatus?: RsvpStatus;
}

// Represents an Event or a collection of guests.
export interface Group {
  id:string;
  name: string;
  createdAt: string;
  defaultScanLimit?: number;
  designTemplateId?: string;
  maxMembers?: number;
  whatsappMessageTemplate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  locationAddress?: string;
  locationLink?: string;
}

export interface ScanLog {
  id: string;
  memberId: string;
  memberName: string;
  scannedAt: string;
  status: 'success' | 'limit_reached' | 'invalid';
  scannedBy?: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  backgroundImage: string; // data URL
  titleText: string;
  bodyText: string;
  titleColor: string;
  bodyColor: string;
  nameColor?: string;
  qrCodeSize?: number; // As a percentage of canvas width
  qrCodePosX?: number; // As a percentage from left
  qrCodePosY?: number; // As a percentage from top
  titleFont?: string;
  titleFontSize?: number;
  bodyFont?: string;
  bodyFontSize?: number;
  nameFont?: string;
  nameFontSize?: number;
  showEventDates?: boolean;
  showGuestName?: boolean; // Show/hide guest name
  guestNamePosX?: number; // Guest name X position (percentage from left)
  guestNamePosY?: number; // Guest name Y position (percentage from top)
  qrCodeStyle?: 'squares' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
  qrCodeColor?: string;
  qrCodeBackgroundColor?: string;
  qrCodeCornerSquareType?: 'square' | 'extra-rounded' | 'dot';
  qrCodeCornerDotType?: 'square' | 'dot';
  qrCodeCenterImage?: string; // data URL
  barcodeType?: 'qrcode' | 'code128' | 'codabar';
}

export interface Message {
  id: string;
  thankYouMessage: string;
  followUpMessage: string;
  rsvpMessage: string;
}

declare global {
  interface Window {
    ZXingBrowser: any;
    QRCodeStyling: any;
    bwipjs: any;
  }
}