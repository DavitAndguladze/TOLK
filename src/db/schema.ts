// MySQL 8 (HeatWave in OCI, Docker locally), ADR-0010. Content rows keep the shared type as JSON
// (`data`) plus the few columns we look up by; the JSON is the source of truth.
import { boolean, index, int, json, mysqlTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import type { Book, ChapterCheck, ChapterVersion, Chapter, Level, SessionResult, FlaggedWord } from "../types";
import type { IngestedChapterPolicy } from "../leveling/ingestion";
import type { GeneratedChapter } from "../leveling/generator";

const id = (name = "id") => varchar(name, { length: 191 });
const createdAt = () => timestamp("created_at", { fsp: 3 }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { fsp: 3 }).notNull().defaultNow();

export const flaggedWords = mysqlTable("flagged_words", {
  readerId: id("reader_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  chapterVersionId: id("chapter_version_id").notNull().references(() => chapterVersions.id),
  tokenIndex: int("token_index").notNull(),
  data: json("data").$type<FlaggedWord>().notNull(),
}, (t) => [primaryKey({ columns: [t.readerId, t.chapterVersionId, t.tokenIndex] })]);

export const chapterPolicies = mysqlTable("chapter_policies", {
  chapterId: id("chapter_id").primaryKey().references(() => chapters.id),
  data: json("data").$type<IngestedChapterPolicy>().notNull(),
});

export const chapterArtifacts = mysqlTable("chapter_artifacts", {
  versionId: id("version_id").primaryKey().references(() => chapterVersions.id),
  data: json("data").$type<GeneratedChapter>().notNull(),
});

export const chapterGenerations = mysqlTable("chapter_generations", {
  id: id().primaryKey(),
  readerId: id("reader_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  bookId: id("book_id").notNull(),
  chapterNumber: int("chapter_number").notNull(),
  level: int("level").$type<Level>().notNull(),
  baselineVersionId: id("baseline_version_id").notNull().references(() => chapterVersions.id),
  status: varchar("status", { length: 16 }).$type<"pending" | "ready" | "failed">().notNull().default("pending"),
  artifactVersionId: id("artifact_version_id").references(() => chapterVersions.id),
  claimToken: id("claim_token"),
  provenance: json("provenance").$type<GeneratedChapter["provenance"]>(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("chapter_generations_reader_baseline").on(t.readerId, t.baselineVersionId)]);

// ── Better Auth (core schema; a Reader is a Better Auth user) ────────────
export const user = mysqlTable("user", {
  id: id().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = mysqlTable("session", {
  id: id().primaryKey(),
  expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: id("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_idx").on(t.userId)]);

export const account = mysqlTable("account", {
  id: id().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: id("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("account_user_idx").on(t.userId)]);

export const verification = mysqlTable("verification", {
  id: id().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

// ── Content ──────────────────────────────────────────────────────────────
export const books = mysqlTable("books", {
  id: id().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  data: json("data").$type<Book>().notNull(),
});

export const chapters = mysqlTable("chapters", {
  id: id().primaryKey(),
  bookId: id("book_id").notNull(),
  number: int("number").notNull(),
  data: json("data").$type<Chapter>().notNull(),
}, (t) => [uniqueIndex("chapters_book_number").on(t.bookId, t.number)]);

/** Immutable once ready: a served Chapter Version or Check is never rewritten (0017). */
export const chapterVersions = mysqlTable("chapter_versions", {
  id: id().primaryKey(),
  /** null = shared (Chapter 1 at L1, fallbacks). */
  readerId: id("reader_id"),
  bookId: id("book_id").notNull(),
  chapterNumber: int("chapter_number").notNull(),
  level: int("level").$type<Level>().notNull(),
  data: json("data").$type<ChapterVersion>().notNull(),
}, (t) => [index("chapter_versions_lookup").on(t.bookId, t.chapterNumber, t.level)]);

export const chapterChecks = mysqlTable("chapter_checks", {
  id: id().primaryKey(),
  chapterVersionId: id("chapter_version_id").notNull().unique(),
  data: json("data").$type<ChapterCheck>().notNull(),
});

// ── Reader progress ──────────────────────────────────────────────────────
export const bookProgress = mysqlTable("book_progress", {
  readerId: id("reader_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  bookId: id("book_id").notNull(),
  currentChapterNumber: int("current_chapter_number").notNull(),
  currentLevel: int("current_level").$type<Level>().notNull(),
  currentVersionId: id("current_version_id").notNull(),
  /** When currentLevel last actually changed (null: never). Level history counts only Chapters after it (#41). */
  levelChangedAt: timestamp("level_changed_at", { fsp: 3 }),
  updatedAt: updatedAt(),
}, (t) => [primaryKey({ columns: [t.readerId, t.bookId] })]);

/** One per Reader per Chapter Version: a duplicate submit keeps the first (0017). */
export const sessionResults = mysqlTable("session_results", {
  id: id().primaryKey(),
  readerId: id("reader_id").notNull(),
  bookId: id("book_id").notNull(),
  chapterVersionId: id("chapter_version_id").notNull(),
  chapterNumber: int("chapter_number").notNull(),
  level: int("level").$type<Level>().notNull(),
  completedAt: timestamp("completed_at", { fsp: 3 }).notNull(),
  data: json("data").$type<SessionResult>().notNull(),
}, (t) => [
  uniqueIndex("session_results_reader_version").on(t.readerId, t.chapterVersionId),
  index("session_results_history").on(t.readerId, t.bookId, t.completedAt),
]);
