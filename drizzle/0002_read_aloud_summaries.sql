CREATE TABLE `read_aloud_summaries` (
	`reader_id` varchar(191) NOT NULL,
	`chapter_version_id` varchar(191) NOT NULL,
	`data` json NOT NULL,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `read_aloud_summaries_reader_id_chapter_version_id_pk` PRIMARY KEY(`reader_id`,`chapter_version_id`)
);
