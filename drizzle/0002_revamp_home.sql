CREATE TABLE `box_styles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`outer_color` varchar(9) NOT NULL,
	`inner_color` varchar(9) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `box_styles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `box_contents` ADD `sort_order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` ADD `tagline` varchar(60);--> statement-breakpoint
ALTER TABLE `boxes` ADD `price_on_request` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` ADD `style_id` int;--> statement-breakpoint
ALTER TABLE `collections` ADD `short_name` varchar(60);--> statement-breakpoint
ALTER TABLE `collections` ADD `date_rule` varchar(160);--> statement-breakpoint
ALTER TABLE `collections` ADD `date_label` varchar(60);--> statement-breakpoint
ALTER TABLE `collections` ADD `featured_box_id` int;--> statement-breakpoint
ALTER TABLE `items` ADD `blurb` varchar(120);--> statement-breakpoint
ALTER TABLE `boxes` ADD CONSTRAINT `boxes_style_id_box_styles_id_fk` FOREIGN KEY (`style_id`) REFERENCES `box_styles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collections` ADD CONSTRAINT `collections_featured_box_id_boxes_id_fk` FOREIGN KEY (`featured_box_id`) REFERENCES `boxes`(`id`) ON DELETE set null ON UPDATE no action;