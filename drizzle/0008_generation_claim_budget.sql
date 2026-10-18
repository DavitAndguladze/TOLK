ALTER TABLE `chapter_generations` ADD `claim_count` int DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Historical claims were not counted; do not grant a fresh budget to an already attempted job.
UPDATE `chapter_generations` SET `claim_count` = 3 WHERE `claim_token` IS NOT NULL OR `status` <> 'pending';
