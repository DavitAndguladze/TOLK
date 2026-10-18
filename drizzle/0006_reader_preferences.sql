CREATE TABLE `reader_preferences` (
	`reader_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `reader_preferences_reader_id` PRIMARY KEY(`reader_id`)
);
--> statement-breakpoint
ALTER TABLE `reader_preferences` ADD CONSTRAINT `reader_preferences_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;