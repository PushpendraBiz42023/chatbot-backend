import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuthSchema1789454174289 implements MigrationInterface {
    name = 'InitAuthSchema1789454174289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`is_verified\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`auth_sessions\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`revoked_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_fc7c8b01bebb6839399c494d68\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`otp_verifications\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`purpose\` enum ('SIGNUP_VERIFICATION', 'PASSWORD_RESET') NOT NULL, \`code_hash\` varchar(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`attempts\` int NOT NULL DEFAULT '0', \`max_attempts\` int NOT NULL DEFAULT '5', \`consumed_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_062720ff9c437614c8eee8f3a3\` (\`email\`, \`purpose\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`password_reset_tokens\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`consumed_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_91185d86d5d7557b19abbb2868\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`auth_sessions\` ADD CONSTRAINT \`FK_50ccaa6440288a06f0ba693ccc6\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` ADD CONSTRAINT \`FK_52ac39dd8a28730c63aeb428c9c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` DROP FOREIGN KEY \`FK_52ac39dd8a28730c63aeb428c9c\``);
        await queryRunner.query(`ALTER TABLE \`auth_sessions\` DROP FOREIGN KEY \`FK_50ccaa6440288a06f0ba693ccc6\``);
        await queryRunner.query(`DROP INDEX \`IDX_91185d86d5d7557b19abbb2868\` ON \`password_reset_tokens\``);
        await queryRunner.query(`DROP TABLE \`password_reset_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_062720ff9c437614c8eee8f3a3\` ON \`otp_verifications\``);
        await queryRunner.query(`DROP TABLE \`otp_verifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_fc7c8b01bebb6839399c494d68\` ON \`auth_sessions\``);
        await queryRunner.query(`DROP TABLE \`auth_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
