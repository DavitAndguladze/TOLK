CREATE TABLE `chapter_completions` (
	`reader_id` varchar(191) NOT NULL,
	`chapter_version_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapter_completions_reader_id_chapter_version_id_pk` PRIMARY KEY(`reader_id`,`chapter_version_id`)
);
--> statement-breakpoint
CREATE TABLE `reader_word_banks` (
	`reader_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `reader_word_banks_reader_id` PRIMARY KEY(`reader_id`)
);
--> statement-breakpoint
ALTER TABLE `chapter_completions` ADD CONSTRAINT `chapter_completions_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_completions` ADD CONSTRAINT `chapter_completions_chapter_version_id_chapter_versions_id_fk` FOREIGN KEY (`chapter_version_id`) REFERENCES `chapter_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reader_word_banks` ADD CONSTRAINT `reader_word_banks_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;