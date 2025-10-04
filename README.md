# 🦉 OWL-App - Academic Social Learning Platform

A comprehensive academic social platform that connects students, teachers, and academics worldwide. OWL-App is built with modern technologies and designed for seamless knowledge sharing, collaborative learning, and educational content management.

> 🚀 **Latest Updates:** AI-powered content generation with Google Gemini, enhanced security measures, improved theme system, and optimized user experience. [See changelog →](release/)

## 🌟 Overview

OWL-App is a full-stack educational social platform that enables students and educators to share study materials, collaborate in communities, and engage in meaningful academic discussions. The platform features advanced content moderation, real-time notifications, and sophisticated user management systems.

## ✨ Key Features

### 📚 **Academic Content Sharing**
- **Study Materials** - Share notes, exam materials, and educational resources
- **AI Content Generation** - Auto-generate flashcards, questions, and study notes with Google Gemini
- **Post Creation** - Rich text editor with image support and syntax highlighting
- **Subject Categorization** - Organized content by academic subjects
- **Content Discovery** - AI-powered recommendations and trending content
- **Document Processing** - Upload PDFs, DOCX files for AI content generation

### 📱 **Advanced Media Support**
- **Multi-format Video Player** - YouTube, Vimeo, custom videos
- **Audio Playback** - Music and lecture recordings
- **PDF Viewer** - Document reading and annotation
- **Image Gallery** - Photo sharing and organization
- **Rich Text Editor** - Advanced formatting and styling
- **Syntax Highlighting** - Code sharing and viewing

### 🎯 **Interactive Work Environment**
- **Drag & Drop Workspace** - Customizable study environment
- **Rich Note Editor** - Markdown support with version history
- **Calendar Integration** - Event management and scheduling
- **Pomodoro Timer** - Focus sessions with statistics
- **Task Management** - Kanban-style project boards
- **Flashcard System** - Spaced repetition learning
- **RSS Feed Reader** - External content integration
- **Spotify Integration** - Music for study sessions
- **Real-time Collaboration** - Multi-user workspace sharing

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
- **NextAuth.js** - Modern authentication with Google OAuth (replaced Firebase Auth)
- **Session Management** - JWT-based secure sessions with Prisma adapter
- **Two-Factor Authentication** - Enhanced account security
- **Parental Consent** - COPPA compliance for younger users
- **Age Verification** - Built-in age verification system

### 📊 **Content Management**
- **Pools/Collections** - Organize and categorize saved content
- **Tagging System** - Advanced content organization
- **Search & Filter** - Powerful search capabilities
- **Analytics Dashboard** - Comprehensive admin analytics

## 🏗️ Technology Stack

> 📝 **Note:** Firebase was completely removed in v0.2.0. The platform now uses NextAuth.js for authentication, Prisma for database management, and local file system for storage - resulting in ~200KB bundle size reduction and better performance.

### 🎯 **Core Framework**
- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **npm** - Node.js package manager

### 🗄️ **Database & Backend**
- **Prisma ORM** - Type-safe database toolkit (replaced Firebase Firestore)
- **SQLite** - Development database
- **PostgreSQL** - Production-ready database (recommended)
- **NextAuth.js** - Authentication and session management (replaced Firebase Auth)
- **Socket.io** - Real-time communication
- **Local File System** - Image storage with Sharp optimization

### 🧩 **UI & Components**
- **shadcn/ui** - High-quality UI components built on Radix UI
- **Framer Motion** - Smooth animations and interactions
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### 🔧 **Advanced Features**
- **React Query** - Server state management
- **Zustand** - Client state management
- **Sharp** - Image optimization
- **Google Gemini AI** - AI content generation
- **Sanitize HTML** - XSS protection and content sanitization
- **IndexedDB** - Client-side storage for offline-first features
- **React Markdown** - Markdown rendering
- **Recharts** - Data visualization

### 🌍 **Internationalization**
- **Next Intl** - Multi-language support (English & Turkish)
- **Localized UI** - Complete i18n implementation

---

### 🔄 Firebase Migration (v0.2.0)

| Firebase Service | Replaced With | Benefits |
|-----------------|---------------|----------|
| **Firebase Auth** | NextAuth.js + Google OAuth | Better CSRF protection, JWT sessions |
| **Firestore** | Prisma ORM + SQLite/PostgreSQL | Type safety, better migrations, SQL power |
| **Firebase Storage** | Local File System + Sharp | No external dependencies, faster processing |
| **Firebase SDK** | Removed | ~200KB bundle size reduction |

All user data was automatically migrated with zero data loss. The new architecture provides better performance, type safety, and developer experience.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/xenitV1/owl-app.git
cd owl-app

# Install dependencies with npm
npm install

# Set up environment variables
cp .env.example .env.local
# Configure your environment variables

# Set up the database
npm run db:push
npm run db:generate

# Start development server
npm run dev
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

# Google Gemini AI (for AI content generation)
GEMINI_API_KEY="your-gemini-api-key"

# YouTube API (Optional - for enhanced YouTube features)
YOUTUBE_API_KEY="your-youtube-api-key"

# Spotify Web API (Optional - for Spotify playlist integration)
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

## 🔧 API Setup Instructions

### Google Gemini AI Setup

To enable AI content generation features:

1. **Get Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy your API key

2. **Configure Environment Variables**:
   - Add to your `.env.local` file:
     ```
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     ```

3. **Features Enabled**:
   - AI-generated flashcards from documents
   - Practice questions with multiple choice
   - Structured study notes
   - Multi-language content generation
   - Age-appropriate content filtering

**Note**: Gemini API offers a generous free tier for testing and development.

### Spotify Web API Setup

To enable Spotify playlist integration in RSS feeds:

1. **Create a Spotify App**:
   - Go to [Spotify Developer Console](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in app name (e.g., "OWL-App") and description
   - Set redirect URI to: `https://owl-app.com` (if you have SSL certificate) or `http://localhost:3000` (for development)
     - **Note**: For localhost, Spotify will show a security warning, but this is normal for development. Click "Save anyway" to continue.

2. **Get API Credentials**:
   - Copy the **Client ID** from your app dashboard
   - Click "Show Client Secret" to get the **Client Secret**

3. **Configure Environment Variables**:
   - Add to your `.env.local` file:
     ```
     SPOTIFY_CLIENT_ID=your_actual_client_id_here
     SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
     ```

4. **Features Enabled**:
   - View playlist tracks as RSS feed items
   - Display album artwork thumbnails
   - Show artist and album information
   - Click tracks to open Spotify embed player

**Note**: Without API credentials, Spotify integration falls back to embed-only mode.

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
│       ├── ai/            # AI content generation
│       ├── communities/   # Community management
│       ├── posts/         # Content management
│       ├── sounds/        # Secure sound file serving
│       └── ...           # Other APIs
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── ai/               # AI content generation components
│   ├── auth/             # Authentication components
│   ├── communities/      # Community components
│   ├── content/          # Content components
│   ├── moderation/       # Moderation components
│   ├── work-environment/ # Workspace cards and tools
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
│   ├── ai/              # AI integration and document processing
│   └── ...              # Other utilities
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
npm run db:push

# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Reset database
npm run db:reset
```

### Testing
```bash
# Set up test data
npm run test:e2e:setup-data

# Clean up test data
npm run test:e2e:cleanup-data

# Reset test database
npm run test:e2e:reset-db
```

### Linting & Formatting
```bash
# Run ESLint
npm run lint

# Build for production
npm run build

# Start production server
npm start
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
- **XSS Protection** - Industry-standard sanitize-html library (OWASP compliance)
- **CSRF Protection** - NextAuth.js security features
- **Environment Variables** - Secure credential management
- **Secret Rotation** - Regular security updates
- **Content Sanitization** - Multi-layer HTML sanitization preventing nested tag attacks
- **API Route Security** - Protected endpoints with user-agent validation

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

We welcome contributions from the community! 🎉

### Ways to Contribute

* 🐛 **Report bugs** - Help us identify and fix issues
* ✨ **Suggest features** - Share your ideas for new functionality
* 💻 **Write code** - Submit pull requests with improvements
* 📚 **Improve documentation** - Help make our docs better
* 🎨 **UI/UX improvements** - Enhance the user experience
* 🌐 **Translations** - Add support for new languages

### Getting Started

1. Check out our [Contributing Guide](CONTRIBUTING.md) for detailed instructions
2. Look for issues labeled `good first issue` if you're new to the project
3. Join our community discussions for questions and support

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/xenitV1/OWL-App.git

# Install dependencies
npm install

# Set up development environment
cp .env.example .env.local
npm run db:push
npm run dev
```

We appreciate all contributions, big or small! 🚀

## 📄 License & Commercial Use

The repository includes a community license that allows non‑commercial use. For commercial use, an Enterprise Commercial License is available.

- Community (Non‑Commercial): see `LICENSE`
- Enterprise (Commercial): see `COMMERCIAL_LICENSE.md` and contact us below

Official website: https://owl-app.com

For clarity on what counts as non‑commercial vs commercial usage, see section "Non‑Commercial Clarifications" in `LICENSE`. Use of names, logos, and domains is governed by `TRADEMARKS.md`.

### Community vs Enterprise

| Capability | Community (NC) | Enterprise |
| --- | --- | --- |
| Production commercial use | ❌ Not permitted | ✅ Permitted |
| Source access | ✅ Yes | ✅ Yes |
| Brand usage | Limited (see TRADEMARKS) | With agreement |
| Updates | ✅ Public releases | ✅ Public releases |
| Support/SLA | Community best effort | Optional SLAs |

### Commercial Licensing

For pricing, quotes, and custom terms, contact: `mehmet.apaydin0@outlook.com`

## 📱 Connect with the Creator

Follow me on social media for updates, insights, and discussions about OWL and educational technology:

- 🐦 **Twitter/X**: [@xenit_v0](https://x.com/xenit_v0)
- 💼 **LinkedIn**: [Mehmet Apaydın](https://www.linkedin.com/in/apaydinm/)
- 🦉 **GitHub**: [@xenitV1](https://github.com/xenitV1)

Feel free to reach out for questions, feedback, or collaboration opportunities! 🚀

## 🙏 Acknowledgments

Special thanks to the open-source community and the following technologies that made this platform possible:
- Next.js team for the amazing framework
- Google for Gemini AI and authentication services
- Radix UI for accessible component primitives
- Prisma for the excellent database toolkit
- shadcn for the beautiful component library
- All open-source contributors who made this project possible

---

**Built by Xenit using Z.ai GLM 4.5 and Cursor IDE**
