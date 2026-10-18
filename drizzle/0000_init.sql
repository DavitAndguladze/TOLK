CREATE TABLE `account` (
	`id` varchar(191) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_progress` (
	`reader_id` varchar(191) NOT NULL,
	`book_id` varchar(191) NOT NULL,
	`current_chapter_number` int NOT NULL,
	`current_level` int NOT NULL,
	`current_version_id` varchar(191) NOT NULL,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `book_progress_reader_id_book_id_pk` PRIMARY KEY(`reader_id`,`book_id`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`author` varchar(255) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapter_checks` (
	`id` varchar(191) NOT NULL,
	`chapter_version_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapter_checks_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapter_checks_chapter_version_id_unique` UNIQUE(`chapter_version_id`)
);
--> statement-breakpoint
CREATE TABLE `chapter_versions` (
	`id` varchar(191) NOT NULL,
	`reader_id` varchar(191),
	`book_id` varchar(191) NOT NULL,
	`chapter_number` int NOT NULL,
	`level` int NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapter_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` varchar(191) NOT NULL,
	`book_id` varchar(191) NOT NULL,
	`number` int NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_book_number` UNIQUE(`book_id`,`number`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(191) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(191) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(191) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_progress` ADD CONSTRAINT `book_progress_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `chapter_versions_lookup` ON `chapter_versions` (`book_id`,`chapter_number`,`level`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);