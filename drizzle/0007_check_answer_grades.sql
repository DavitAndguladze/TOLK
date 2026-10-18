CREATE TABLE `check_answer_grades` (
	`reader_id` varchar(191) NOT NULL,
	`check_id` varchar(191) NOT NULL,
	`question_id` varchar(191) NOT NULL,
	`answer_hash` varchar(64) NOT NULL,
	`data` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `check_answer_grades_pk` PRIMARY KEY(`reader_id`,`check_id`,`question_id`,`answer_hash`)
);
--> statement-breakpoint
ALTER TABLE `check_answer_grades` ADD CONSTRAINT `check_answer_grades_reader_id_user_id_fk` FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;