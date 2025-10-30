/**
 * PERMANENT ADMIN FIX FOR PANICSENSE
 * 
 * This file contains a single function that ensures the panicsenseadmin user
 * exists with admin privileges in the database.
 */

import { Pool } from 'pg';
import { Express } from 'express';
import bcrypt from 'bcryptjs';

// Single function to make panicsenseadmin an admin permanently
export async function makePanicsenseAdminPermanent(app: Express, pool: Pool): Promise<boolean> {
  console.log("🔒 PERMANENT ADMIN: Starting permanent admin user fix");
  
  try {
    // Get admin credentials from environment variables or use defaults for development
    const adminUsername = process.env.ADMIN_USERNAME || 'panicsenseadmin';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456789';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@panicsense.ph';
    
    // SECURITY: Require secure password in production - fail fast if not set
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.ADMIN_PASSWORD) {
        console.error("❌ FATAL ERROR: ADMIN_PASSWORD environment variable is required in production!");
        console.error("Please set a secure ADMIN_PASSWORD before starting the application.");
        throw new Error("ADMIN_PASSWORD is required in production mode");
      }
      
      if (adminPassword === '123456789') {
        console.error("❌ FATAL ERROR: Default admin password detected in production!");
        console.error("Please set a secure ADMIN_PASSWORD environment variable.");
        throw new Error("Default password is not allowed in production mode");
      }
      
      // Verify password strength (minimum 12 characters)
      if (adminPassword.length < 12) {
        console.error("❌ FATAL ERROR: Admin password must be at least 12 characters in production!");
        throw new Error("Admin password too weak for production deployment");
      }
    }
    
    // Hash the password for secure storage
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin user exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [adminUsername]
    );
    
    if (checkResult.rows.length > 0) {
      // User exists, update to admin role and password
      await pool.query(
        'UPDATE users SET password = $1, role = $2 WHERE username = $3',
        [hashedPassword, 'admin', adminUsername]
      );
      
      console.log("✅ PERMANENT ADMIN: Updated panicsenseadmin to admin role");
    } else {
      // User doesn't exist, create it
      await pool.query(
        'INSERT INTO users (username, password, email, full_name, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          adminUsername,
          hashedPassword,
          adminEmail,
          'PanicSense Administrator',
          'admin',
          new Date()
        ]
      );
      
      console.log("✅ PERMANENT ADMIN: Created panicsenseadmin user with admin role");
    }

    // Also create a simple client-side admin login fix page (for development only)
    if (process.env.NODE_ENV !== 'production') {
      app.get('/admin-login-fix', (_req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Admin Login Fix</title>
              <style>
                body { font-family: Arial; padding: 20px; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; }
                button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; }
                pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>PanicSense Admin Login Fix</h1>
                <p>Click the button below to set up your browser for admin access:</p>
                <button onclick="setupAdmin()">Fix Admin Login</button>
                <div id="result" style="margin-top: 20px;"></div>
                
                <h3>Admin Credentials:</h3>
                <pre>
Username: ${adminUsername}
Password: ${adminPassword}
                </pre>
                
                <p><a href="/login">Go to Login Page</a> | <a href="/dashboard">Go to Dashboard</a></p>
              </div>
              
              <script>
                function setupAdmin() {
                  const resultEl = document.getElementById('result');
                  resultEl.innerHTML = "Setting up admin...";
                  
                  try {
                    // Create admin user
                    const adminUser = {
                      id: 999,
                      username: '${adminUsername}',
                      role: 'admin',
                      email: '${adminEmail}',
                      fullName: 'PanicSense Administrator'
                    };
                    
                    // Set all admin-related data in localStorage
                    localStorage.clear();
                    localStorage.setItem('auth_token', \`admin_\${Date.now()}\`);
                    localStorage.setItem('admin_user', JSON.stringify(adminUser));
                    localStorage.setItem('user_role', 'admin');
                    localStorage.setItem('is_admin', 'true');
                    localStorage.setItem('display_username', '${adminUsername}');
                    
                    resultEl.innerHTML = "<strong>Success!</strong> Admin login is fixed. You can now navigate to any page with admin access.";
                  } catch (error) {
                    resultEl.innerHTML = "Error: " + error.message;
                  }
                }
              </script>
            </body>
          </html>
        `);
      });
      
      console.log("✅ PERMANENT ADMIN: Added /admin-login-fix page for client-side fix");
    }
    
    return true;
  } catch (error) {
    console.error("❌ PERMANENT ADMIN: Error making admin permanent:", error);
    return false;
  }
}
