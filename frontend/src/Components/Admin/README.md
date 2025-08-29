# Admin Dashboard Documentation

## Overview
This admin dashboard is designed for Vithanage Enterprises' electrical appliance store. It provides a comprehensive interface for managing all aspects of the e-commerce platform.

## Features

### 1. Dashboard Overview
- Key metrics and statistics at a glance
- Recent activity feed
- Action required items (pending orders, low stock alerts)

### 2. User Management
- View all users
- Add, edit, and delete users
- Filter users by role (admin/regular)
- Search functionality

### 3. Product Management
- View all products
- Add, edit, and delete products
- Filter products by category
- Manage product details, images, and pricing

### 4. Order & Cart Management
- View and process customer orders
- Update order status (pending, processing, shipped, delivered)
- View order details and customer information
- Print invoices

### 5. Inventory Management
- Monitor stock levels
- Receive alerts for low stock items
- Update inventory quantities
- Track inventory history

### 6. Financial & Promotion Management
- View revenue metrics
- Create and manage promotions and discounts
- Set promotion duration and discount percentages
- Apply promotions to specific products or categories

### 7. Reviews & Ratings
- Monitor product reviews
- Respond to customer feedback
- Filter reviews by rating
- Moderate inappropriate content

### 8. Refund Management
- Process refund requests
- Track refund status
- View refund history
- Generate refund reports

## Technical Implementation

### Sidebar Navigation
The dashboard features a responsive sidebar that collapses to an icon-only view on smaller screens.

### Module-Based Structure
The dashboard is built with a modular approach where each section (Users, Products, Orders, etc.) is loaded dynamically based on user selection.

### Responsive Design
The dashboard is fully responsive and works well on desktop, tablet, and mobile devices.

### Authentication & Security
Access is restricted to admin users only, with JWT authentication required for all operations.

## Usage Guide

1. **Login**: Use admin credentials to access the dashboard.
2. **Navigation**: Use the sidebar to navigate between different management modules.
3. **Actions**: Each module has specific actions (add, edit, delete) relevant to that section.
4. **Search & Filter**: Use the search bars and filter dropdowns to find specific items.
5. **Logout**: Use the logout button at the bottom of the sidebar when finished.

## Future Enhancements
- Data export to CSV/PDF
- Advanced analytics and reporting
- Role-based permissions for different admin levels
- Integration with email for notifications
- Real-time updates with WebSockets
