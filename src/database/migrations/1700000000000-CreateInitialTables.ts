import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM('MENTEE', 'MENTOR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "transaction_type_enum" AS ENUM('PURCHASE', 'BOOKING', 'REFUND', 'EXPIRED', 'BONUS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    const usersTableExists = await queryRunner.hasTable('users');
    if (!usersTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'user_role_enum',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    const creditPackagesTableExists = await queryRunner.hasTable('credit_packages');
    if (!creditPackagesTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'credit_packages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'credits',
            type: 'integer',
          },
          {
            name: 'price',
            type: 'integer',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
      );
    }

    const userCreditsTableExists = await queryRunner.hasTable('user_credits');
    if (!userCreditsTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'user_credits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'totalPurchased',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'totalUsed',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
        ],
      }),
      true,
      );
    }

    const creditTransactionsTableExists = await queryRunner.hasTable('credit_transactions');
    if (!creditTransactionsTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'credit_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'integer',
          },
          {
            name: 'type',
            type: 'transaction_type_enum',
          },
          {
            name: 'referenceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    const bookingsTableExists = await queryRunner.hasTable('bookings');
    if (!bookingsTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'menteeId',
            type: 'uuid',
          },
          {
            name: 'mentorId',
            type: 'uuid',
          },
          {
            name: 'scheduledAt',
            type: 'timestamptz',
          },
          {
            name: 'duration',
            type: 'integer',
          },
          {
            name: 'creditsUsed',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'booking_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    const userCreditsTable = await queryRunner.getTable('user_credits');
    const userCreditsFkExists = userCreditsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (!userCreditsFkExists) {
      await queryRunner.createForeignKey(
        'user_credits',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Constraint: balance não pode ser negativo
    const balanceCheckExists = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_credits' 
      AND constraint_name = 'CHK_USER_CREDITS_BALANCE_NON_NEGATIVE'
    `);
    if (balanceCheckExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE user_credits 
        ADD CONSTRAINT CHK_USER_CREDITS_BALANCE_NON_NEGATIVE 
        CHECK (balance >= 0)
      `);
    }

    // Constraint: totalPurchased e totalUsed não podem ser negativos
    const totalsCheckExists = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_credits' 
      AND constraint_name = 'CHK_USER_CREDITS_TOTALS_NON_NEGATIVE'
    `);
    if (totalsCheckExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE user_credits 
        ADD CONSTRAINT CHK_USER_CREDITS_TOTALS_NON_NEGATIVE 
        CHECK (totalPurchased >= 0 AND totalUsed >= 0)
      `);
    }

    const creditTransactionsTable = await queryRunner.getTable('credit_transactions');
    const creditTransactionsFkExists = creditTransactionsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (!creditTransactionsFkExists) {
      await queryRunner.createForeignKey(
        'credit_transactions',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    const bookingsTable = await queryRunner.getTable('bookings');
    const bookingsMenteeFkExists = bookingsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('menteeId') !== -1,
    );
    if (!bookingsMenteeFkExists) {
      await queryRunner.createForeignKey(
        'bookings',
        new TableForeignKey({
          columnNames: ['menteeId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    const bookingsMentorFkExists = bookingsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('mentorId') !== -1,
    );
    if (!bookingsMentorFkExists) {
      await queryRunner.createForeignKey(
        'bookings',
        new TableForeignKey({
          columnNames: ['mentorId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      const emailIndexExists = usersTable.indices.find(
        (idx) => idx.name === 'IDX_USERS_EMAIL',
      );
      if (!emailIndexExists) {
        await queryRunner.createIndex(
          'users',
          new TableIndex({
            name: 'IDX_USERS_EMAIL',
            columnNames: ['email'],
          }),
        );
      }
    }

    const creditTransactionsTableForIndex = await queryRunner.getTable('credit_transactions');
    if (creditTransactionsTableForIndex) {
      const userIdIndexExists = creditTransactionsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_CREDIT_TRANSACTIONS_USER_ID',
      );
      if (!userIdIndexExists) {
        await queryRunner.createIndex(
          'credit_transactions',
          new TableIndex({
            name: 'IDX_CREDIT_TRANSACTIONS_USER_ID',
            columnNames: ['userId'],
          }),
        );
      }

      const userCreatedIndexExists = creditTransactionsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_CREDIT_TRANSACTIONS_USER_CREATED',
      );
      if (!userCreatedIndexExists) {
        await queryRunner.createIndex(
          'credit_transactions',
          new TableIndex({
            name: 'IDX_CREDIT_TRANSACTIONS_USER_CREATED',
            columnNames: ['userId', 'createdAt'],
          }),
        );
      }

      const typeIndexExists = creditTransactionsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_CREDIT_TRANSACTIONS_TYPE',
      );
      if (!typeIndexExists) {
        await queryRunner.createIndex(
          'credit_transactions',
          new TableIndex({
            name: 'IDX_CREDIT_TRANSACTIONS_TYPE',
            columnNames: ['type'],
          }),
        );
      }
    }

    const bookingsTableForIndex = await queryRunner.getTable('bookings');
    if (bookingsTableForIndex) {
      const menteeIdIndexExists = bookingsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_BOOKINGS_MENTEE_ID',
      );
      if (!menteeIdIndexExists) {
        await queryRunner.createIndex(
          'bookings',
          new TableIndex({
            name: 'IDX_BOOKINGS_MENTEE_ID',
            columnNames: ['menteeId'],
          }),
        );
      }

      const mentorIdIndexExists = bookingsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_BOOKINGS_MENTOR_ID',
      );
      if (!mentorIdIndexExists) {
        await queryRunner.createIndex(
          'bookings',
          new TableIndex({
            name: 'IDX_BOOKINGS_MENTOR_ID',
            columnNames: ['mentorId'],
          }),
        );
      }

      const mentorStatusScheduledIndexExists = bookingsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_BOOKINGS_MENTOR_STATUS_SCHEDULED',
      );
      if (!mentorStatusScheduledIndexExists) {
        await queryRunner.createIndex(
          'bookings',
          new TableIndex({
            name: 'IDX_BOOKINGS_MENTOR_STATUS_SCHEDULED',
            columnNames: ['mentorId', 'status', 'scheduledAt'],
          }),
        );
      }

      const scheduledAtIndexExists = bookingsTableForIndex.indices.find(
        (idx) => idx.name === 'IDX_BOOKINGS_SCHEDULED_AT',
      );
      if (!scheduledAtIndexExists) {
        await queryRunner.createIndex(
          'bookings',
          new TableIndex({
            name: 'IDX_BOOKINGS_SCHEDULED_AT',
            columnNames: ['scheduledAt'],
          }),
        );
      }

      // Constraint: duration deve ser 30 ou 60
      const durationCheckExists = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'CHK_BOOKINGS_DURATION'
      `);
      if (durationCheckExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE bookings 
          ADD CONSTRAINT CHK_BOOKINGS_DURATION 
          CHECK (duration IN (30, 60))
        `);
      }

      // Constraint: creditsUsed deve ser positivo
      const creditsCheckExists = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'CHK_BOOKINGS_CREDITS_POSITIVE'
      `);
      if (creditsCheckExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE bookings 
          ADD CONSTRAINT CHK_BOOKINGS_CREDITS_POSITIVE 
          CHECK (creditsUsed > 0)
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userCreditsTable = await queryRunner.getTable('user_credits');
    const userCreditsForeignKey = userCreditsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (userCreditsForeignKey) {
      await queryRunner.dropForeignKey('user_credits', userCreditsForeignKey);
    }

    const creditTransactionsTable = await queryRunner.getTable('credit_transactions');
    const creditTransactionsForeignKey = creditTransactionsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (creditTransactionsForeignKey) {
      await queryRunner.dropForeignKey('credit_transactions', creditTransactionsForeignKey);
    }

    const bookingsTable = await queryRunner.getTable('bookings');
    const bookingsMenteeForeignKey = bookingsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('menteeId') !== -1,
    );
    if (bookingsMenteeForeignKey) {
      await queryRunner.dropForeignKey('bookings', bookingsMenteeForeignKey);
    }

    const bookingsMentorForeignKey = bookingsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('mentorId') !== -1,
    );
    if (bookingsMentorForeignKey) {
      await queryRunner.dropForeignKey('bookings', bookingsMentorForeignKey);
    }

    await queryRunner.dropTable('bookings');
    await queryRunner.dropTable('credit_transactions');
    await queryRunner.dropTable('user_credits');
    await queryRunner.dropTable('credit_packages');
    await queryRunner.dropTable('users');

    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
