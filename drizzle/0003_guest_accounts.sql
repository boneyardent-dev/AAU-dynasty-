CREATE TABLE IF NOT EXISTS `guest_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`recovery_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `guest_users_recovery_hash_unique` ON `guest_users` (`recovery_hash`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sessions_user` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
