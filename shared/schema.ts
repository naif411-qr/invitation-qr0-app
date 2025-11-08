// Reference: blueprint:javascript_database
import { pgTable, text, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'user', or 'scanner'
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Groups (Events) table
export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  defaultScanLimit: integer("default_scan_limit"),
  designTemplateId: text("design_template_id"),
  maxMembers: integer("max_members"),
  whatsappMessageTemplate: text("whatsapp_message_template"),
  eventStartDate: text("event_start_date"),
  eventEndDate: text("event_end_date"),
  locationAddress: text("location_address"),
  locationLink: text("location_link"),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Members (Guests) table
export const members = pgTable("members", {
  id: text("id").primaryKey(),
  ticketNumber: text("ticket_number"), // Short number for barcode (e.g., "00001", "00002")
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  scanLimit: integer("scan_limit").notNull(),
  scanCount: integer("scan_count").notNull().default(0),
  groupId: text("group_id").notNull(),
  rsvpStatus: text("rsvp_status").default("pending"), // 'confirmed' | 'declined' | 'pending'
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

// Scan Logs table
export const scanLogs = pgTable("scan_logs", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  memberName: text("member_name").notNull(),
  scannedAt: text("scanned_at").notNull(),
  status: text("status").notNull(), // 'success' | 'limit_reached' | 'invalid'
  scannedBy: text("scanned_by"), // username of the scanner
});

export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = typeof scanLogs.$inferInsert;

// Design Templates table
export const designTemplates = pgTable("design_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  backgroundImage: text("background_image").notNull(),
  titleText: text("title_text").notNull(),
  bodyText: text("body_text").notNull(),
  titleColor: text("title_color").notNull(),
  bodyColor: text("body_color").notNull(),
  nameColor: text("name_color"),
  qrCodeSize: real("qr_code_size"),
  qrCodePosX: real("qr_code_pos_x"),
  qrCodePosY: real("qr_code_pos_y"),
  titleFont: text("title_font"),
  titleFontSize: integer("title_font_size"),
  bodyFont: text("body_font"),
  bodyFontSize: integer("body_font_size"),
  nameFont: text("name_font"),
  nameFontSize: integer("name_font_size"),
  showEventDates: boolean("show_event_dates"),
  showGuestName: boolean("show_guest_name"),
  guestNamePosX: real("guest_name_pos_x"),
  guestNamePosY: real("guest_name_pos_y"),
  qrCodeStyle: text("qr_code_style"),
  qrCodeColor: text("qr_code_color"),
  qrCodeBackgroundColor: text("qr_code_background_color"),
  qrCodeCornerSquareType: text("qr_code_corner_square_type"),
  qrCodeCornerDotType: text("qr_code_corner_dot_type"),
  qrCodeCenterImage: text("qr_code_center_image"),
  barcodeType: text("barcode_type"),
});

export type DesignTemplate = typeof designTemplates.$inferSelect;
export type InsertDesignTemplate = typeof designTemplates.$inferInsert;

// Relations
export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
}));

// Messages table for thank you and follow up messages
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  thankYouMessage: text("thank_you_message").notNull(),
  followUpMessage: text("follow_up_message").notNull(),
  rsvpMessage: text("rsvp_message"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
