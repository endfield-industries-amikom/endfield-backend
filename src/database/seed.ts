import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Role } from 'src/roles/role.entity';
import { User } from 'src/users/users.entity';
import { DataSourceOptions } from 'typeorm/browser';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({
  path: path.resolve(__dirname, '../../.env.development.local'),
});

export async function seed() {
  console.log('🌱 Starting database seed...');

  const dataSourceConfig: DataSourceOptions = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    connectTimeoutMS: 15000,
    ssl: { rejectUnauthorized: false },
  };

  let dataSource: DataSource;

  if (process.env.DB_URL) {
    dataSource = new DataSource({
      ...dataSourceConfig,
      url: process.env.DB_URL,
      extra: {
        enableChannelBinding: true,
      },
    });
  } else {
    dataSource = new DataSource({
      ...dataSourceConfig,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_NAME || 'inventory_db',
      extra: {
        enableChannelBinding: true
      },
    });
  }

  await dataSource.initialize();
  console.log('✅ Database connected');

  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── 1. Seed roles ─────────────────────────────────────────────
    console.log('\n📋 Seeding roles...');

    const roles = [
      { roleName: 'Admin' },
      { roleName: 'Employee' },
      { roleName: 'Consumer' },
      { roleName: 'Editor' },
    ];

    for (const roleData of roles) {
      const existing = await roleRepo.findOne({
        where: { roleName: roleData.roleName },
      });
      if (existing) {
        console.log(
          `  ⏭  Role "${roleData.roleName}" already exists (id=${existing.id})`,
        );
      } else {
        const role = roleRepo.create(roleData);
        const saved = await roleRepo.save(role);
        console.log(
          `  ✅ Role "${roleData.roleName}" created (id=${saved.id})`,
        );
      }
    }

    // ── 2. Seed default Admin user ─────────────────────────────────
    console.log('\n👤 Seeding default Admin user...');

    const adminRole = await roleRepo.findOne({
      where: { roleName: 'Admin' },
    });
    if (!adminRole) {
      throw new Error('Admin role not found after seeding');
    }

    const existingAdmin = await userRepo.findOne({
      where: { email: 'endmin@endfield.com' },
    });

    if (existingAdmin) {
      console.log(`  ⏭  Admin user already exists (id=${existingAdmin.id})`);
    } else {
      const passwordHash = await argon2.hash('endminStrongPassword');
      const adminUser = userRepo.create({
        username: 'endmin',
        email: 'endmin@endfield.com',
        fullName: 'Endfield Admin',
        passwordHash,
        roleId: adminRole.id,
      });
      const saved = await userRepo.save(adminUser);
      console.log(`  ✅ Admin user created:`);
      console.log(`     email   : endmin@endfield.com`);
      console.log(`     username: endmin`);
      console.log(`     password: endmin`);
      console.log(`     role    : Admin (id=${adminRole.id})`);
      console.log(`     user_id : ${saved.id}`);
    }

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}
