CREATE TABLE `chapter_artifacts` (
	`version_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapter_artifacts_version_id` PRIMARY KEY(`version_id`)
);
--> statement-breakpoint
CREATE TABLE `chapter_generations` (
	`id` varchar(191) NOT NULL,
	`reader_id` varchar(191) NOT NULL,
	`book_id` varchar(191) NOT NULL,
	`chapter_number` int NOT NULL,
	`level` int NOT NULL,
	`baseline_version_id` varchar(191) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`artifact_version_id` varchar(191),
	`claim_token` varchar(191),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `chapter_generations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapter_generations_reader_baseline` UNIQUE(`reader_id`,`baseline_version_id`)
);
--> statement-breakpoint
CREATE TABLE `chapter_policies` (
	`chapter_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `chapter_policies_chapter_id` PRIMARY KEY(`chapter_id`)
);
--> statement-breakpoint
CREATE TABLE `flagged_words` (
	`reader_id` varchar(191) NOT NULL,
	`chapter_version_id` varchar(191) NOT NULL,
	`token_index` int NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `flagged_words_reader_id_chapter_version_id_token_index_pk` PRIMARY KEY(`reader_id`,`chapter_version_id`,`token_index`)
);
--> statement-breakpoint
ALTER TABLE `chapter_artifacts` ADD CONSTRAINT `chapter_artifacts_version_id_chapter_versions_id_fk` FOREIGN KEY (`version_id`) REFERENCES `chapter_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_generations` ADD CONSTRAINT `chapter_generations_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_generations` ADD CONSTRAINT `chapter_generations_baseline_version_id_chapter_versions_id_fk` FOREIGN KEY (`baseline_version_id`) REFERENCES `chapter_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_generations` ADD CONSTRAINT `chapter_generations_artifact_version_id_chapter_versions_id_fk` FOREIGN KEY (`artifact_version_id`) REFERENCES `chapter_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_policies` ADD CONSTRAINT `chapter_policies_chapter_id_chapters_id_fk` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flagged_words` ADD CONSTRAINT `flagged_words_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flagged_words` ADD CONSTRAINT `flagged_words_chapter_version_id_chapter_versions_id_fk` FOREIGN KEY (`chapter_version_id`) REFERENCES `chapter_versions`(`id`) ON DELETE no action ON UPDATE no action;