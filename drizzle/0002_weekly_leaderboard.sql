CREATE TABLE IF NOT EXISTS `weekly_scores` (
	`user_id` text NOT NULL,
	`week` text NOT NULL,
	`program` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`day` text NOT NULL,
	`points_at_day_start` integer DEFAULT 0 NOT NULL,
	`first_day` text NOT NULL,
	`first_at` text NOT NULL,
	`last_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `week`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `weekly_scores_week_points` ON `weekly_scores` (`week`, `points` DESC);
