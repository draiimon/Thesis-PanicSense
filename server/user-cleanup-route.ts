/**
 * User cleanup route
 * This endpoint handles user data cleanup securely from the server side
 */

import { Pool } from 'pg';
import { Express } from 'express';
import bcrypt from 'bcryptjs';

export function setupUserCleanupRoute(app: Express, pool: Pool): void {
  // Get admin credentials from environment variables or use defaults
  const adminUsername = process.env.ADMIN_USERNAME || 'panicsenseadmin';
  const adminPassword = process.env.ADMIN_PASSWORD || '123456789';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@panicsense.ph';
  
  // SECURITY: Verify password in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_PASSWORD || adminPassword === '123456789') {
      console.error("❌ ERROR: Secure ADMIN_PASSWORD required in production!");
    }
  }
  
  // Special endpoint to clean up users - DISABLED IN PRODUCTION FOR SECURITY
  // This endpoint is only available in development mode to prevent unauthorized data deletion
  app.post('/api/cleanup-users', async (_req, res) => {
    // SECURITY: Block this endpoint in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Attempted to access /api/cleanup-users in production mode - BLOCKED');
      return res.status(403).json({ 
        success: false, 
        message: 'This endpoint is disabled in production for security reasons' 
      });
    }
    
    try {
      console.log('Starting user cleanup...');
      
      // 1. Delete all users except admin
      const deleteResult = await pool.query(`
        DELETE FROM users 
        WHERE username != $1
      `, [adminUsername]);
      
      console.log(`Deleted ${deleteResult.rowCount} user accounts`);
      
      // 2. Check if admin exists
      const adminCheck = await pool.query(`
        SELECT * FROM users WHERE username = $1
      `, [adminUsername]);
      
      if (adminCheck.rows.length === 0) {
        // Create the admin user if it doesn't exist
        console.log('Creating admin user with credentials from environment');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await pool.query(`
          INSERT INTO users (username, password, email, full_name, role, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [adminUsername, hashedPassword, adminEmail, 'PanicSense Administrator', 'admin', new Date()]);
        
        return res.json({ 
          success: true, 
          message: 'Created admin user with default credentials and deleted all other users' 
        });
      } else {
        // Update the admin password
        console.log('Updating admin user password');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await pool.query(`
          UPDATE users 
          SET password = $1, role = 'admin'
          WHERE username = $2
        `, [hashedPassword, adminUsername]);
        
        return res.json({ 
          success: true, 
          message: 'Reset admin user password to default and deleted all other users' 
        });
      }
    } catch (error) {
      console.error('Error during user cleanup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false, 
        message: 'User cleanup failed',
        error: errorMessage 
      });
    }
  });
  
  // Simple HTML button to trigger the cleanup (for development only)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/cleanup-users', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>PanicSense User Cleanup</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              h1 {
                color: #3b82f6;
              }
              .warning {
                color: #ef4444;
                font-weight: bold;
              }
              button {
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
              }
              button:hover {
                background-color: #2563eb;
              }
              #result {
                margin-top: 20px;
                padding: 10px;
                border-radius: 5px;
                display: none;
              }
              .success {
                background-color: #d1fae5;
                border: 1px solid #10b981;
              }
              .error {
                background-color: #fee2e2;
                border: 1px solid #ef4444;
              }
            </style>
          </head>
          <body>
            <h1>PanicSense User Cleanup</h1>
            <p>This utility will:</p>
            <ul>
              <li>Delete all users except for the admin</li>
              <li>Reset the admin password to the configured value</li>
              <li>Ensure the admin has the correct role</li>
            </ul>
            <p class="warning">Warning: This action cannot be undone!</p>
            
            <button id="cleanupBtn">Clean Up Users</button>
            
            <div id="result"></div>
            
            <script>
              document.getElementById('cleanupBtn').addEventListener('click', async () => {
                if (!confirm('Are you sure you want to clean up all users? This cannot be undone!')) {
                  return;
                }
                
                const resultEl = document.getElementById('result');
                resultEl.innerHTML = 'Processing...';
                resultEl.style.display = 'block';
                resultEl.className = '';
                
                try {
                  const response = await fetch('/api/cleanup-users', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    resultEl.innerHTML = \`<p>Success: \${data.message}</p>
                      <p>The admin credentials are configured in your environment variables.</p>
                      <p>You can now <a href="/admin-login">login to the admin panel</a>.</p>
                    \`;
                    resultEl.className = 'success';
                  } else {
                    resultEl.innerHTML = \`<p>Error: \${data.message}</p>\`;
                    resultEl.className = 'error';
                  }
                } catch (error) {
                  resultEl.innerHTML = \`<p>Error: \${error.message}</p>\`;
                  resultEl.className = 'error';
                }
              });
            </script>
          </body>
        </html>
      `);
    });
  }
}
