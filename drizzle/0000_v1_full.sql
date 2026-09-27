CREATE TABLE `add_ons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`price` int NOT NULL,
	`image` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`stock` int,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `add_ons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blackout_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`reason` varchar(120) NOT NULL,
	CONSTRAINT `blackout_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `box_collections` (
	`box_id` int NOT NULL,
	`collection_id` int NOT NULL,
	CONSTRAINT `box_collections_box_id_collection_id_pk` PRIMARY KEY(`box_id`,`collection_id`)
);
--> statement-breakpoint
CREATE TABLE `box_contents` (
	`box_id` int NOT NULL,
	`item_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	CONSTRAINT `box_contents_box_id_item_id_pk` PRIMARY KEY(`box_id`,`item_id`)
);
--> statement-breakpoint
CREATE TABLE `box_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`box_id` int NOT NULL,
	`url` varchar(255) NOT NULL,
	`alt` varchar(190),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `box_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`code` varchar(20),
	`summary` varchar(255),
	`description` text,
	`price` int NOT NULL,
	`compare_at_price` int,
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`badge` varchar(40),
	`featured` boolean NOT NULL DEFAULT false,
	`same_day` boolean NOT NULL DEFAULT true,
	`lead_days` int NOT NULL DEFAULT 0,
	`stock` int,
	`seo_title` varchar(190),
	`seo_description` varchar(300),
	`tags` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `boxes_id` PRIMARY KEY(`id`),
	CONSTRAINT `boxes_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `boxes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `builder_sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255),
	`capacity` int NOT NULL,
	`base_price` int NOT NULL,
	`image` varchar(255),
	`allowed_items` text,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `builder_sizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('OCCASION','RECIPIENT','CURATED') NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`intro` text,
	`image` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`show_on_home` boolean NOT NULL DEFAULT false,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `collections_kind_slug` UNIQUE(`kind`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`type` enum('PERCENT','FIXED','FREE_DELIVERY') NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	`min_spend` int NOT NULL DEFAULT 0,
	`starts_at` datetime,
	`ends_at` datetime,
	`usage_limit` int,
	`used` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(190),
	`phone` varchar(20) NOT NULL,
	`marketing_consent` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`date` date NOT NULL,
	`slot_id` int,
	`zone_id` int,
	`fee` int NOT NULL,
	`carrier` varchar(80),
	`tracking` varchar(80),
	`photo` varchar(255),
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_order_id_unique` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(80) NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`end_time` varchar(5) NOT NULL,
	`capacity` int NOT NULL DEFAULT 20,
	`cutoff` varchar(5) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `delivery_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`cities` text NOT NULL,
	`fee` int NOT NULL,
	`same_day` boolean NOT NULL DEFAULT true,
	`lead_days` int NOT NULL DEFAULT 0,
	`cod_allowed` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `delivery_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('CUSTOM','CORPORATE','CONTACT') NOT NULL,
	`name` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(190),
	`company` varchar(160),
	`occasion` varchar(80),
	`budget` varchar(40),
	`date` date,
	`quantity` int,
	`message` text NOT NULL,
	`photo` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'new',
	`created_at` datetime NOT NULL,
	CONSTRAINT `enquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(255) NOT NULL,
	`answer` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finder_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question_id` int NOT NULL,
	`label` varchar(80) NOT NULL,
	`tags` varchar(300) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `finder_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finder_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(160) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `finder_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`size` varchar(60),
	`cost` int,
	`stock` int,
	`maker_id` int,
	`builder_enabled` boolean NOT NULL DEFAULT false,
	`builder_price` int,
	`image` varchar(255),
	`category` varchar(60),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `makers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`place` varchar(120),
	`story` text,
	`photo` varchar(255),
	CONSTRAINT `makers_id` PRIMARY KEY(`id`),
	CONSTRAINT `makers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notification_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('EMAIL','SMS','PUSH','WHATSAPP') NOT NULL,
	`to` varchar(600) NOT NULL,
	`subject` varchar(200),
	`body` text NOT NULL,
	`event` varchar(40) NOT NULL,
	`order_id` int,
	`status` enum('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
	`attempts` int NOT NULL DEFAULT 0,
	`error` text,
	`run_after` datetime NOT NULL,
	`sent_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `notification_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`type` varchar(30) NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`box_id` int,
	`add_on_id` int,
	`name` varchar(160) NOT NULL,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	`builder_size_id` int,
	`meta` json,
	CONSTRAINT `order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`status` enum('PENDING','CONFIRMED','PACKED','DISPATCHED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`source` enum('WEB','WHATSAPP','MESSENGER','PHONE','INSTAGRAM','QUOTE','BULK') NOT NULL DEFAULT 'WEB',
	`customer_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	`subtotal` int NOT NULL,
	`delivery_fee` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`coupon_code` varchar(40),
	`gift_message` text,
	`surprise` boolean NOT NULL DEFAULT false,
	`call_to_arrange` boolean NOT NULL DEFAULT false,
	`customer_note` text,
	`internal_note` text,
	`voucher_code` varchar(40),
	`voucher_amount` int NOT NULL DEFAULT 0,
	`notify_channels` json,
	`bulk_ref` varchar(20),
	`quote_id` int,
	`review_token` varchar(40),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target` varchar(190) NOT NULL,
	`code_hash` varchar(100) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`method` enum('COD','BANK_TRANSFER','VOUCHER') NOT NULL,
	`amount` int NOT NULL,
	`status` enum('PENDING','SLIP_UPLOADED','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`slip` varchar(255),
	`reference` varchar(120),
	`created_at` datetime NOT NULL,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`box_id` int NOT NULL,
	`min_qty` int NOT NULL,
	`unit_price` int NOT NULL,
	CONSTRAINT `price_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`keys` json NOT NULL,
	`audience` enum('OWNER','CUSTOMER') NOT NULL,
	`order_id` int,
	`created_at` datetime NOT NULL,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_subscriptions_endpoint_unique` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE TABLE `quote_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote_id` int NOT NULL,
	`box_id` int,
	`name` varchar(160) NOT NULL,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT `quote_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`token` varchar(40) NOT NULL,
	`status` enum('REQUESTED','SENT','ACCEPTED','DECLINED','EXPIRED') NOT NULL DEFAULT 'REQUESTED',
	`company` varchar(160),
	`contact_name` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(190),
	`quantity` int,
	`budget` varchar(40),
	`needed_by` date,
	`branding` varchar(160),
	`request` text NOT NULL,
	`photo` varchar(255),
	`delivery_fee` int NOT NULL DEFAULT 0,
	`discount` int NOT NULL DEFAULT 0,
	`notes` text,
	`expires_at` date,
	`order_id` int,
	`created_at` datetime NOT NULL,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_number_unique` UNIQUE(`number`),
	CONSTRAINT `quotes_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int,
	`name` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(80) NOT NULL,
	`notes` text,
	CONSTRAINT `recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`occasion` varchar(80) NOT NULL,
	`month` int NOT NULL,
	`day` int NOT NULL,
	`channel` enum('EMAIL','SMS') NOT NULL DEFAULT 'EMAIL',
	`days_before` int NOT NULL DEFAULT 7,
	`last_sent_year` int,
	`created_at` datetime NOT NULL,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`box_id` int,
	`name` varchar(120) NOT NULL,
	`rating` int NOT NULL,
	`body` text,
	`photo` varchar(255),
	`approved` boolean NOT NULL DEFAULT false,
	`reply` text,
	`created_at` datetime NOT NULL,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(190) NOT NULL,
	`password_hash` varchar(100) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'owner',
	`totp_secret` varchar(64),
	`totp_enabled` boolean NOT NULL DEFAULT false,
	`last_login_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`token` varchar(40) NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL,
	`status` enum('PENDING','ACTIVE','USED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`buyer_name` varchar(120) NOT NULL,
	`buyer_phone` varchar(20) NOT NULL,
	`buyer_email` varchar(190),
	`to_name` varchar(120),
	`to_email` varchar(190),
	`to_phone` varchar(20),
	`message` varchar(300),
	`payment_method` enum('BANK_TRANSFER','CASH','FREE') NOT NULL DEFAULT 'BANK_TRANSFER',
	`slip` varchar(255),
	`expires_at` date,
	`created_at` datetime NOT NULL,
	CONSTRAINT `vouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `vouchers_code_unique` UNIQUE(`code`),
	CONSTRAINT `vouchers_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `box_collections` ADD CONSTRAINT `box_collections_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `box_collections` ADD CONSTRAINT `box_collections_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `box_contents` ADD CONSTRAINT `box_contents_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `box_contents` ADD CONSTRAINT `box_contents_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `box_images` ADD CONSTRAINT `box_images_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_slot_id_delivery_slots_id_fk` FOREIGN KEY (`slot_id`) REFERENCES `delivery_slots`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_zone_id_delivery_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `delivery_zones`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finder_answers` ADD CONSTRAINT `finder_answers_question_id_finder_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `finder_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `items` ADD CONSTRAINT `items_maker_id_makers_id_fk` FOREIGN KEY (`maker_id`) REFERENCES `makers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_events` ADD CONSTRAINT `order_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_lines` ADD CONSTRAINT `order_lines_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_lines` ADD CONSTRAINT `order_lines_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_lines` ADD CONSTRAINT `order_lines_add_on_id_add_ons_id_fk` FOREIGN KEY (`add_on_id`) REFERENCES `add_ons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_recipient_id_recipients_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `recipients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_tiers` ADD CONSTRAINT `price_tiers_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quote_lines` ADD CONSTRAINT `quote_lines_quote_id_quotes_id_fk` FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quote_lines` ADD CONSTRAINT `quote_lines_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipients` ADD CONSTRAINT `recipients_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_box_id_boxes_id_fk` FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `boxes_status_idx` ON `boxes` (`status`);--> statement-breakpoint
CREATE INDEX `deliveries_date_idx` ON `deliveries` (`date`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `notification_jobs` (`status`,`run_after`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `otp_target_idx` ON `otp_codes` (`target`);--> statement-breakpoint
CREATE INDEX `reviews_box_idx` ON `reviews` (`box_id`,`approved`);