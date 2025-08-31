# Admin/User Separation in Vithanage Enterprises

## Overview

This update separates admin and regular user details into two distinct collections in the database. Previously, all users were stored in a single `User` collection with an `isAdmin` flag to differentiate admins from regular users.

Now, admin users are stored in a dedicated `Admin` collection, while regular users remain in the `User` collection.

## Key Changes

1. **Database Structure**:
   - Created a new `Admin` model with role support (admin/super_admin)
   - Removed the `isAdmin` field from the `User` model
   - Added password hashing and comparison methods to both models

2. **Authentication**:
   - Updated auth controller to check both collections during login
   - Created a separate admin authentication controller
   - Modified authentication middleware to handle both user and admin tokens

3. **API Routes**:
   - Created dedicated admin authentication routes
   - Updated the auth routes to work with the new models
   - Added a data migration endpoint for transferring existing admin users

4. **Frontend**:
   - Updated the Login component to handle both user and admin login

## How to Run the Migration

To migrate existing admin users from the `User` collection to the new `Admin` collection, you can use one of the following methods:

### Method 1: Migration Script

Run the migration script directly:

```bash
cd BackEnd
node utils/migrateUsers.js
```

This will:
- Find all users with `isAdmin: true` in the `User` collection
- Create corresponding records in the `Admin` collection
- Save a migration log to `BackEnd/utils/migration_log.json`

### Method 2: API Endpoint

Access the migration endpoint (super_admin access only):

1. Log in as a super admin
2. Send a POST request to:
   ```
   POST http://localhost:5000/api/admin-auth/migrate
   Header: x-auth-token: <your-super-admin-token>
   ```

## Initial Admin Setup

When the server starts for the first time after this update, it automatically creates an initial super admin account:

- Email: admin@vithanage.com
- Password: admin123
- Role: super_admin

**IMPORTANT**: Change this password immediately after first login!

## Testing the Separation

1. Start the backend server
2. Try logging in with a regular user account - you should be redirected to the products page
3. Try logging in with an admin account - you should be redirected to the admin dashboard

## Notes for Future Development

- Consider adding more fields to the Admin model as needed
- Implement admin account creation through the admin dashboard
- Add role-based access control for different admin functions
