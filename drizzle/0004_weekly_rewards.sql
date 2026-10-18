CREATE TABLE IF NOT EXISTS `weekly_claims` (
	`user_id` text NOT NULL,
	`week` text NOT NULL,
	`packs` integer NOT NULL,
	`rank` integer NOT NULL,
	`games` integer NOT NULL,
	`tier` text NOT NULL,
	`status` text NOT NULL,
	`claimed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `week`)
);
