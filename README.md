# Chronosync

A responsive, multi-functional task management application designed to help users efficiently manage their personal affairs with advanced analytics, collaboration features, and seamless cross-platform accessibility.

## 🚀 Features

### Core Task Management
- **Smart Task Organization**: Create, edit, and organize tasks with categories, priorities, and due dates
- **Status Tracking**: Track tasks through todo, in-progress, and completed states
- **Advanced Filtering**: Filter tasks by status, category, priority, and search terms
- **Reminder System**: Set custom reminders for important tasks

### Data Statistics and Visualization
- **Productivity Reports**: Generate comprehensive productivity reports based on task priority and completion time
- **Priority-Based Analytics**: Detailed breakdown of completion rates by priority level
- **Completion Time Analysis**: Track average completion times for different priority tasks
- **Visual Charts**: Interactive charts showing task distribution, weekly productivity, and completion trends
- **Performance Metrics**: Overall completion rates and productivity indicators

### Collaboration and Sharing
- **Task Sharing**: Share individual tasks with others via secure public links
- **Expirable Links**: Set expiration dates for shared task links
- **Collaborative Lists**: Allow multiple users to jointly manage shared task lists/categories
- **Role-Based Access**: Assign viewer, editor, or admin roles to collaborators
- **Public Task View**: Beautiful public interface for viewing shared tasks

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Instant synchronization across all your devices
- **Dark/Light Theme**: Clean, modern interface with accessibility features
- **Notification System**: Browser notifications for task reminders
- **Intuitive Navigation**: Easy-to-use interface with logical navigation flow

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: SQLite with TypeORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Design**: RESTful APIs with comprehensive validation
- **Security**: Protected routes with role-based access control

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: TailwindCSS for responsive design
- **UI Components**: NextUI component library
- **Charts**: Recharts for data visualization
- **State Management**: React hooks with custom state management
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **Build System**: Turbopack for fast development builds
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Type Safety**: Full TypeScript implementation across the stack
- **Testing**: Jest testing framework (configurable)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/wangxcloveliuc/Chronosync.git
   cd Chronosync
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start both frontend (localhost:3000) and backend (localhost:3001) servers.

### Individual Setup

**Backend Setup:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Build and Deployment

### Production Build
```bash
# Build both frontend and backend
npm run build

# Or build individually
npm run build:frontend
npm run build:backend
```

### Available Scripts

**Root Level:**
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run install:all` - Install dependencies for all projects

**Backend:**
- `npm run start:dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code

**Frontend:**
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint code

## 📊 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Task Management
- `GET /tasks` - Get user tasks (with filtering)
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /tasks/stats` - Get productivity statistics

### Task Sharing
- `POST /tasks/:id/share` - Create task share
- `GET /tasks/shares` - Get user's task shares
- `DELETE /tasks/shares/:id` - Revoke task share
- `GET /public/tasks/shared/:token` - View shared task (public)

### Category Management
- `GET /tasks/categories/all` - Get user categories
- `POST /tasks/categories` - Create category
- `PATCH /tasks/categories/:id` - Update category
- `DELETE /tasks/categories/:id` - Delete category

### Collaboration
- `POST /tasks/categories/:id/collaborators` - Add collaborator
- `GET /tasks/categories/:id/collaborators` - Get collaborators
- `GET /tasks/categories/shared` - Get shared categories
- `DELETE /tasks/categories/:categoryId/collaborators/:userId` - Remove collaborator
- `PATCH /tasks/categories/:categoryId/collaborators/:userId` - Update collaborator role

## 🎨 UI/UX Features

### Dashboard
- Task overview with statistics cards
- Quick task creation and editing
- Advanced filtering and search
- Real-time task status updates

### Analytics
- Comprehensive productivity charts
- Priority-based completion analysis
- Time-based performance tracking
- Visual data representation

### Collaboration Interface
- Intuitive task sharing modal
- Public task viewing with call-to-action
- Collaborative category management
- Role-based access controls

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- Secure task sharing with unique tokens
- Expirable share links

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📱 Mobile Responsiveness

The application is fully responsive and provides an optimized experience across:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Created by the Chronosync Team - helping you manage time more effectively.

## 🔮 Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] Real-time collaboration features
- [ ] Advanced notification system
- [ ] Integration with calendar applications
- [ ] Offline support with sync
- [ ] Advanced reporting and exports
- [ ] Team management features
- [ ] API webhooks

---

**Get started with Chronosync today and take control of your productivity!**
