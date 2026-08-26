CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`registrationNumber` varchar(64),
	`taxNumber` varchar(64),
	`contactPerson` varchar(128),
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `material_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `material_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `operational_input_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryMethod` enum('voice','camera','image','pdf','manual') NOT NULL,
	`sourceType` enum('vehicle_load','receiving_note','voice_command') NOT NULL,
	`sourceEntityId` int,
	`smartIntakeDraftId` int,
	`commandText` text,
	`analysisModel` varchar(128),
	`analysisConfidence` decimal(5,4),
	`action` varchar(128) NOT NULL,
	`outcome` enum('pending_review','confirmed','rejected','failed') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_input_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receiving_note_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receivingNoteId` int NOT NULL,
	`materialTypeId` int,
	`materialName` varchar(256) NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`unitPrice` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `receiving_note_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receiving_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptNumber` varchar(40) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int,
	`vehicleLoadDraftId` int,
	`receiptDate` timestamp NOT NULL,
	`referenceNo` varchar(100),
	`sourceDocumentUrl` text,
	`sourceDocumentName` varchar(256),
	`entryMethod` enum('voice','camera','image','pdf','manual') NOT NULL,
	`analysisModel` varchar(128),
	`analysisConfidence` decimal(5,4),
	`analysisPayload` json,
	`status` enum('pending_review','confirmed','rejected') NOT NULL DEFAULT 'pending_review',
	`createdByUserId` int NOT NULL,
	`confirmedByUserId` int,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receiving_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `receiving_notes_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_load_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftNumber` varchar(40) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`smartIntakeDraftId` int,
	`loadDate` timestamp NOT NULL,
	`referenceNo` varchar(100),
	`sourceDocumentUrl` text,
	`sourceDocumentName` varchar(256),
	`entryMethod` enum('voice','camera','image','pdf','manual') NOT NULL,
	`analysisModel` varchar(128),
	`analysisConfidence` decimal(5,4),
	`analysisPayload` json,
	`rawContent` text NOT NULL,
	`status` enum('pending_review','matched','confirmed','rejected','received') NOT NULL DEFAULT 'pending_review',
	`createdByUserId` int NOT NULL,
	`confirmedByUserId` int,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_load_drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_load_drafts_draftNumber_unique` UNIQUE(`draftNumber`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_load_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleLoadDraftId` int NOT NULL,
	`materialTypeId` int,
	`materialName` varchar(256) NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`unitPrice` decimal(15,2),
	`totalPrice` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_load_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plateNumber` varchar(64) NOT NULL,
	`customerId` int,
	`fleetCode` varchar(64),
	`driverName` varchar(128),
	`driverPhone` varchar(32),
	`capacityQuantity` decimal(14,3),
	`capacityUnit` varchar(32),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_plateNumber_unique` UNIQUE(`plateNumber`)
);
--> statement-breakpoint
ALTER TABLE `operational_input_events` ADD CONSTRAINT `op_evt_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_input_events` ADD CONSTRAINT `op_evt_draft_fk` FOREIGN KEY (`smartIntakeDraftId`) REFERENCES `smart_intake_drafts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_note_lines` ADD CONSTRAINT `rnl_note_fk` FOREIGN KEY (`receivingNoteId`) REFERENCES `receiving_notes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_note_lines` ADD CONSTRAINT `rnl_material_fk` FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_notes` ADD CONSTRAINT `rn_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_notes` ADD CONSTRAINT `rn_vehicle_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_notes` ADD CONSTRAINT `rn_load_fk` FOREIGN KEY (`vehicleLoadDraftId`) REFERENCES `vehicle_load_drafts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_notes` ADD CONSTRAINT `rn_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receiving_notes` ADD CONSTRAINT `rn_confirmer_fk` FOREIGN KEY (`confirmedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_drafts` ADD CONSTRAINT `vld_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_drafts` ADD CONSTRAINT `vld_vehicle_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_drafts` ADD CONSTRAINT `vld_intake_fk` FOREIGN KEY (`smartIntakeDraftId`) REFERENCES `smart_intake_drafts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_drafts` ADD CONSTRAINT `vld_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_drafts` ADD CONSTRAINT `vld_confirmer_fk` FOREIGN KEY (`confirmedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_lines` ADD CONSTRAINT `vll_load_fk` FOREIGN KEY (`vehicleLoadDraftId`) REFERENCES `vehicle_load_drafts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_load_lines` ADD CONSTRAINT `vll_material_fk` FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicle_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;
