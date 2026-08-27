CREATE TABLE `routinePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planDate` varchar(10) NOT NULL,
	`preferences` text NOT NULL,
	`blocks` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routinePlans_id` PRIMARY KEY(`id`)
);
