<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Vehicle Parking Management System Instructions

This is a Node.js Express application for managing vehicle parking with SQLite database.

## Database Schema
- **vehicles table**: Contains vehicle information including license plate, type, owner, phone, entry/exit dates, price, and status
- Use SQLite for local database storage

## API Endpoints
- GET /api/vehicles - Get all vehicles
- POST /api/vehicles - Add new vehicle entry
- PUT /api/vehicles/:id - Update vehicle information

## Frontend
- Simple HTML/CSS/JavaScript interface for managing vehicles
- Forms for adding new entries and updating existing ones
- Table view for displaying all vehicle records

## Code Style
- Use ES6+ features where appropriate
- Include proper error handling
- Use async/await for database operations
- Follow RESTful API conventions
