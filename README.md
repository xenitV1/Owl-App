# 🦉 OWL - Academic Social Learning Platform

A comprehensive academic social platform that connects students, teachers, and academics worldwide. Built with modern technologies and designed for seamless knowledge sharing, collaborative learning, and educational content management.

## 🌟 Overview

OWL is a full-stack educational social platform that enables students and educators to share study materials, collaborate in communities, and engage in meaningful academic discussions. The platform features advanced content moderation, real-time notifications, and sophisticated user management systems.

## ✨ Key Features

### 📚 **Academic Content Sharing**
- **Study Materials** - Share notes, exam materials, and educational resources
- **Post Creation** - Rich text editor with image support and syntax highlighting
- **Subject Categorization** - Organized content by academic subjects
- **Content Discovery** - AI-powered recommendations and trending content

### 👥 **Social Learning**
- **Communities** - Join public academic communities by subject or interest
- **Private Groups** - Create exclusive study groups with classmates
- **Following System** - Follow peers and educators
- **Real-time Notifications** - Stay updated on relevant activities

### 🛡️ **Advanced Moderation & Safety**
- **Content Filtering** - Automated content moderation with customizable filters
- **Report System** - Community-driven reporting with admin review
- **Appeal Process** - Fair dispute resolution system
- **User Management** - Comprehensive admin tools for user moderation

### 🔐 **Authentication & Security**
- **Multi-provider Auth** - Google OAuth integration
- **Two-Factor Authentication** - Enhanced account security
- **Parental Consent** - COPPA compliance for younger users
- **Age Verification** - Built-in age verification system

### 📊 **Content Management**
- **Pools/Collections** - Organize and categorize saved content
- **Tagging System** - Advanced content organization
- **Search & Filter** - Powerful search capabilities
- **Analytics Dashboard** - Comprehensive admin analytics

## 🏗️ Technology Stack

### 🎯 **Core Framework**
- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Bun** - Fast JavaScript runtime and package manager

### 🗄️ **Database & Backend**
- **Prisma** - Type-safe database ORM
- **SQLite** - Lightweight database for development
- **NextAuth.js** - Authentication and session management
- **Socket.io** - Real-time communication

### 🧩 **UI & Components**
- **shadcn/ui** - High-quality UI components built on Radix UI
- **Framer Motion** - Smooth animations and interactions
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### 🔧 **Advanced Features**
- **React Query** - Server state management
- **Zustand** - Client state management
- **Sharp** - Image optimization
- **Firebase** - File storage and real-time features
- **React Markdown** - Markdown rendering
- **Recharts** - Data visualization

### 🌍 **Internationalization**
- **Next Intl** - Multi-language support (English & Turkish)
- **Localized UI** - Complete i18n implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/xenitV1/owl.git
cd owl

# Install dependencies with Bun
bun install

# Set up environment variables
cp .env.example .env.local
# Configure your environment variables

# Set up the database
bun run db:push
bun run db:generate

# Start development server
bun run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase (Optional)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── communities/   # Community features
│   │   ├── moderation/    # Moderation tools
│   │   └── ...           # Other pages
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── admin/         # Admin APIs
│       ├── communities/   # Community management
│       ├── posts/         # Content management
│       └── ...           # Other APIs
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── auth/             # Authentication components
│   ├── communities/      # Community components
│   ├── content/          # Content components
│   ├── moderation/       # Moderation components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
├── messages/             # Internationalization files
└── types/                # TypeScript definitions

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## 🎨 Features Deep Dive

### User Roles & Permissions
- **Student** - Basic content creation and community participation
- **Teacher** - Enhanced content creation and community moderation
- **Academician** - Advanced features for academic research
- **Admin** - Full platform administration

### Content Types
- **Posts** - Text, images, and rich media content
- **Comments** - Nested discussion threads
- **Study Materials** - Specialized academic content
- **Community Discussions** - Subject-specific conversations

### Moderation Tools
- **Automated Filtering** - AI-powered content screening
- **Manual Review** - Human moderation workflow
- **Community Reports** - User-generated content flagging
- **Appeal System** - Fair content dispute resolution

### Analytics & Insights
- **User Engagement** - Detailed user activity tracking
- **Content Performance** - Post and material analytics
- **Community Health** - Moderation and safety metrics
- **Admin Dashboard** - Comprehensive platform overview

## 🛠️ Development

### Database Management
```bash
# Push schema changes
bun run db:push

# Generate Prisma client
bun run db:generate

# Create migration
bun run db:migrate

# Reset database
bun run db:reset
```

### Testing
```bash
# Set up test data
bun run test:e2e:setup-data

# Clean up test data
bun run test:e2e:cleanup-data

# Reset test database
bun run test:e2e:reset-db
```

### Linting & Formatting
```bash
# Run ESLint
bun run lint

# Build for production
bun run build

# Start production server
bun start
```

## 🚀 Deployment

The application is containerized and can be deployed using Docker:

```bash
# Build Docker image
docker build -t owl-platform .

# Run container
docker run -p 3000:3000 owl-platform
```

### GitHub Actions
Automated CI/CD pipeline includes:
- **Code Quality** - ESLint and TypeScript checks
- **Testing** - Automated test suite
- **Security Scan** - Dependency vulnerability scanning
- **Docker Build** - Multi-architecture container builds
- **Deployment** - Automated staging and production deployment

## 📊 Admin Features

### User Management
- **User Analytics** - Comprehensive user statistics
- **Role Management** - User role assignment and permissions
- **Account Actions** - Suspend, ban, or verify users
- **Activity Monitoring** - Track user engagement and behavior

### Content Moderation
- **Bulk Actions** - Manage multiple content items simultaneously
- **Filter Management** - Configure automated content filters
- **Report Resolution** - Handle community reports efficiently
- **Appeal Processing** - Manage content appeals and disputes

### Platform Analytics
- **Engagement Metrics** - User interaction and platform usage
- **Content Analytics** - Post performance and trending topics
- **Safety Metrics** - Moderation effectiveness and platform health
- **System Performance** - Technical metrics and monitoring

## 🌐 Internationalization

Currently supports:
- **English** - Complete localization
- **Turkish** - Full native language support

Easy to extend with additional languages through Next Intl configuration.

## 🔒 Security Features

### Data Protection
- **Input Validation** - Comprehensive Zod schema validation
- **SQL Injection Prevention** - Prisma ORM protection
- **XSS Protection** - React built-in protections
- **CSRF Protection** - NextAuth.js security features
- **Environment Variables** - Secure credential management
- **Secret Rotation** - Regular security updates

### User Safety
- **Content Filtering** - Multi-layer content moderation
- **Report System** - Community-driven safety reporting
- **Parental Controls** - COPPA compliance features
- **Privacy Controls** - User data management tools

### 🚨 Security Notice
⚠️ **Important**: Never commit sensitive credentials to version control. 
- Use `.env` files for local development
- Use environment variables for production
- See `SECURITY.md` for detailed security guidelines

## 📈 Performance Optimizations

- **Image Optimization** - Sharp-based image processing
- **Lazy Loading** - Component and route-based code splitting
- **Caching Strategy** - Efficient data caching with React Query
- **Database Optimization** - Indexed queries and efficient schemas

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to:
- Report bugs
- Suggest features
- Submit pull requests
- Follow coding standards

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Special thanks to the open-source community and the following technologies that made this platform possible:
- Next.js team for the amazing framework
- Radix UI for accessible component primitives
- Prisma for the excellent database toolkit
- shadcn for the beautiful component library

---

**Built by Xenit using Z.ai GLM 4.5 and Cursor IDE**
