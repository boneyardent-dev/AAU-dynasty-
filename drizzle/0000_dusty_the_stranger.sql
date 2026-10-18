CREATE TABLE `catalog_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`class_year` integer NOT NULL,
	`position` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_rankings` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`source` text NOT NULL,
	`national_rank` integer,
	`rating` real,
	`stars` integer,
	`source_url` text NOT NULL,
	`observed_at` text NOT NULL
);
