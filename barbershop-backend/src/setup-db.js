const db = require('./db');

async function createUsersTable() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Users table created successfully');

    // Create default admin user if no users exist
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await db.query(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@barbershop.com', hashedPassword, 'Admin User', 'admin']
      );
      
      console.log('✅ Default admin user created:');
      console.log('   Email: admin@barbershop.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password after first login!');
    }

    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    process.exit(0);
  }
}

createUsersTable();
