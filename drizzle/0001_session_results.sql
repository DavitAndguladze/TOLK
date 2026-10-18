CREATE TABLE `session_results` (
	`id` varchar(191) NOT NULL,
	`reader_id` varchar(191) NOT NULL,
	`book_id` varchar(191) NOT NULL,
	`chapter_version_id` varchar(191) NOT NULL,
	`chapter_number` int NOT NULL,
	`level` int NOT NULL,
	`completed_at` timestamp(3) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `session_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_results_reader_version` UNIQUE(`reader_id`,`chapter_version_id`)
);
--> statement-breakpoint
ALTER TABLE `book_progress` ADD `level_changed_at` timestamp(3);--> statement-breakpoint
CREATE INDEX `session_results_history` ON `session_results` (`reader_id`,`book_id`,`completed_at`);