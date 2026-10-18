CREATE TABLE IF NOT EXISTS `vaults` (
	`user_id` text PRIMARY KEY NOT NULL,
	`packs` integer DEFAULT 1 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL,
	`pack_themes` text DEFAULT '[]' NOT NULL,
	`last_batch` text,
	`season_id` text,
	`season_xp` integer DEFAULT 0 NOT NULL,
	`season_claimed` text DEFAULT '[]' NOT NULL,
	`goals_claimed` text DEFAULT '{}' NOT NULL,
	`daily_last` text,
	`daily_streak` integer DEFAULT 0 NOT NULL,
	`daily_best` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vault_cards` (
	`user_id` text NOT NULL,
	`card_key` text NOT NULL,
	`player_id` text NOT NULL,
	`rarity` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`favorite` integer DEFAULT 0 NOT NULL,
	`special_edition` text,
	PRIMARY KEY(`user_id`, `card_key`)
);
