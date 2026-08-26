CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`module` varchar(64) NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`entityLabel` varchar(256),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `architecture_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionId` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`status` enum('proposed','under_review','approved','deprecated','superseded') NOT NULL DEFAULT 'proposed',
	`category` enum('technology','process','data','security','integration','governance','infrastructure') NOT NULL,
	`problemStatement` text,
	`decisionStatement` text,
	`rationale` text,
	`alternatives` text,
	`implications` text,
	`constraints` text,
	`ownerId` int,
	`reviewId` int,
	`supersededById` int,
	`approvedAt` timestamp,
	`neafRevision` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `architecture_decisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `architecture_decisions_decisionId_unique` UNIQUE(`decisionId`)
);
--> statement-breakpoint
CREATE TABLE `architecture_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`outcome` enum('pass','conditional_pass','fail','deferred'),
	`reviewType` enum('architecture_alignment','design_review','implementation_review','compliance_review','post_implementation') NOT NULL,
	`scope` text,
	`findings` text,
	`recommendations` text,
	`reviewerId` int,
	`scheduledDate` timestamp,
	`completedDate` timestamp,
	`neafVersion` varchar(16) DEFAULT '1.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `architecture_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `architecture_reviews_reviewId_unique` UNIQUE(`reviewId`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`code` varchar(32),
	`city` varchar(128),
	`address` text,
	`phone` varchar(32),
	`email` varchar(320),
	`managerId` int,
	`isHeadquarters` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`nameEn` varchar(256),
	`registrationNumber` varchar(64),
	`industry` varchar(128),
	`website` varchar(256),
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`city` varchar(128),
	`country` varchar(128) DEFAULT 'Saudi Arabia',
	`description` text,
	`foundedYear` int,
	`employeeCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`parentDepartmentId` int,
	`name` varchar(256) NOT NULL,
	`code` varchar(32),
	`description` text,
	`managerId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(128),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`status` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`branchId` int,
	`departmentId` int,
	`ownerId` int NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`budget` decimal(15,2),
	`currency` varchar(8) DEFAULT 'SAR',
	`objectives` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchase_request_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseRequestId` int NOT NULL,
	`itemName` varchar(256) NOT NULL,
	`description` text,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(32),
	`estimatedUnitPrice` decimal(15,2),
	`estimatedTotalPrice` decimal(15,2),
	`notes` text,
	CONSTRAINT `purchase_request_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNumber` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`status` enum('draft','submitted','under_review','approved','rejected','cancelled','fulfilled') NOT NULL DEFAULT 'draft',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`requesterId` int NOT NULL,
	`departmentId` int,
	`branchId` int,
	`projectId` int,
	`supplierId` int,
	`totalAmount` decimal(15,2),
	`currency` varchar(8) DEFAULT 'SAR',
	`requiredByDate` timestamp,
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`reviewedById` int,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_requests_requestNumber_unique` UNIQUE(`requestNumber`)
);
--> statement-breakpoint
CREATE TABLE `supplier_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`nameEn` varchar(256),
	`categoryId` int,
	`registrationNumber` varchar(64),
	`taxNumber` varchar(64),
	`contactPerson` varchar(128),
	`email` varchar(320),
	`phone` varchar(32),
	`website` varchar(256),
	`address` text,
	`city` varchar(128),
	`country` varchar(128) DEFAULT 'Saudi Arabia',
	`rating` enum('1','2','3','4','5'),
	`status` enum('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `traceability_matrix` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionId` int NOT NULL,
	`reviewId` int NOT NULL,
	`linkType` enum('originated_from','validated_by','superseded_by','related_to') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `traceability_matrix_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;