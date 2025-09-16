# Document AI Assistant for Product Owners

A comprehensive Document AI Assistant application designed specifically for Product Owners working in SAFe and Agile environments. This app combines document management, note-taking, audio transcription, and an intelligent AI agent with deep knowledge of SAFe methodologies and Agile practices.

![Document AI Assistant](https://img.shields.io/badge/Next.js-15.5.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748)

## 🚀 Features

### ✅ Completed: Full Application
- ✅ **Modern Tech Stack**: Next.js 15.5.3 with TypeScript and Tailwind CSS
- ✅ **Responsive Design**: Three-panel layout optimized for productivity
- ✅ **Green Theme**: Professional green color scheme with dark mode support
- ✅ **Supabase Integration**: PostgreSQL with real-time features and authentication
- ✅ **Component Architecture**: Modular component structure with custom UI components
- ✅ **SAFe AI Agent**: Claude 3 Haiku integration with SAFe methodology expertise
- ✅ **Chat History**: Persistent chat sessions with archive functionality
- ✅ **AI Folder Creation**: Create folders from chat using `[CREATE_FOLDER: name]` commands

### ✅ Authentication & Security
- ✅ **Supabase Auth**: Email/password and OAuth (Google, GitHub) authentication
- ✅ **Row Level Security**: Database-level security policies
- ✅ **Protected Routes**: Middleware-based route protection
- ✅ **Session Management**: Automatic session refresh and management

### ✅ Document Management System
- ✅ **Document Upload**: Drag & drop file upload with Supabase Storage
- ✅ **Document Viewer**: In-app preview for PDFs, text files, and markdown
- ✅ **Document CRUD**: Full create, read, update, delete operations
- ✅ **File Type Support**: PDF, DOCX, TXT, MD files with proper icons
- ✅ **SAFe Artifact Tagging**: Epic, Feature, User Story, Capability classifications
- ✅ **Priority System**: High, Medium, Low priority indicators with color coding
- ✅ **Metadata Management**: Title, tags, artifact type, and priority editing
- ✅ **Grid & List Views**: Multiple viewing options with sorting and filtering

### ✅ Folder Management System
- ✅ **Hierarchical Structure**: Nested folder organization
- ✅ **SAFe Artifact Classification**: Folders tagged with SAFe artifact types
- ✅ **Folder CRUD Operations**: Complete folder management functionality
- ✅ **Document Organization**: Move documents between folders
- ✅ **Circular Reference Protection**: Prevents invalid folder moves

### ✅ Advanced Search & Filtering
- ✅ **Global Search**: Search across documents, folders, notes, and audio
- ✅ **Real-time Search**: Debounced search with instant results
- ✅ **Advanced Filters**: Filter by artifact type, priority, file type, and tags
- ✅ **Search Highlighting**: Highlighted search terms in results
- ✅ **Result Categorization**: Organized results by content type

### ✅ Real-time Features
- ✅ **Live Updates**: Real-time document and folder synchronization
- ✅ **Collaborative Editing**: Multiple users can work simultaneously
- ✅ **Event Subscriptions**: PostgreSQL change event listeners
- ✅ **Automatic Sync**: Changes propagate instantly across sessions

### 📝 Note-Taking System (Planned)
- Rich text editor with markdown support
- Pre-built templates for SAFe artifacts
- Note linking to documents and other notes
- Tag system with SAFe/Agile categories

### 🎵 Audio Management (Planned)
- In-browser recording capability
- Audio transcription service
- Meeting templates for different SAFe ceremonies
- Timestamped annotations

### ✅ SAFe-Knowledgeable AI Agent
- ✅ **Deep SAFe Knowledge**: All roles, events, artifacts, and practices
- ✅ **Agile Expertise**: Scrum, Kanban, Lean methodologies
- ✅ **Product Owner Focus**: Specialized guidance for PO responsibilities
- ✅ **Context-Aware**: Analyzes documents and provides specific recommendations
- ✅ **Best Practices**: INVEST criteria, WSJF prioritization, story mapping
- ✅ **Interactive Chat**: Real-time AI assistance with quick suggestions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.3 with TypeScript
- **Styling**: Tailwind CSS with custom green theme
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with OAuth providers
- **Storage**: Supabase Storage for file uploads
- **AI**: Anthropic Claude API
- **UI Components**: Custom components built with Radix UI primitives
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **State Management**: React Context + useState/useEffect

### Project Structure
```
document-ai-assistant/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── layout/         # Header, sidebar, main layout
│   │   ├── documents/      # Document management components
│   │   ├── folders/        # Folder management (planned)
│   │   ├── notes/          # Note-taking components (planned)
│   │   ├── audio/          # Audio management (planned)
│   │   └── chat/           # AI chat interface
│   ├── lib/
│   │   ├── db.ts          # Prisma database client
│   │   ├── claude.ts      # Claude AI integration
│   │   ├── utils.ts       # Utility functions
│   │   └── vector.ts      # Vector search (planned)
│   ├── stores/            # Zustand state stores (planned)
│   └── types/             # TypeScript type definitions
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier available)
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd document-ai-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Go to Settings > API to get your service role key (for admin operations)
   - Run the SQL migration in your Supabase SQL editor:
     ```sql
     -- Copy and paste the contents of supabase/migrations/001_initial_schema.sql
     ```

4. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Claude AI
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # File Upload
   MAX_FILE_SIZE=50MB

   # Environment
   NODE_ENV=development
   ```

5. **Configure Supabase Storage**
   - Go to Storage in your Supabase dashboard
   - The buckets are automatically created by the migration
   - Ensure RLS policies are enabled for security

6. **Configure Authentication (Optional)**
   - Go to Authentication > Settings in Supabase
   - Configure OAuth providers (Google, GitHub) if desired
   - Set up custom SMTP for email auth (optional)

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 SAFe & Agile Features

### SAFe Framework Support
- **Roles**: Product Owner, Product Manager, System Architect, RTE, Scrum Master
- **Events**: PI Planning, System Demo, Inspect & Adapt, Scrum of Scrums, PO Sync
- **Artifacts**: Program Backlog, Team Backlog, Solution Backlog, Roadmaps, OKRs
- **Principles**: All 10 SAFe Lean-Agile Principles
- **Values**: Alignment, Built-in Quality, Transparency, Program Execution

### AI Agent Capabilities
The AI agent provides expert guidance on:
- **User Story Analysis**: INVEST criteria validation
- **Backlog Prioritization**: WSJF, MoSCoW, Kano model suggestions
- **Acceptance Criteria**: Comprehensive Given-When-Then scenarios
- **PI Planning**: Preparation and execution guidance
- **Stakeholder Management**: Communication strategies
- **Velocity Analysis**: Capacity planning recommendations

## 🎨 Design System

### Color Palette
```css
:root {
  --primary-green: #10B981;    /* Primary brand color */
  --dark-green: #059669;       /* Hover states */
  --light-green: #ecfdf5;      /* Backgrounds */
  --accent-blue: #3B82F6;      /* Secondary actions */
  --warning-amber: #F59E0B;    /* Warnings */
  --error-red: #EF4444;        /* Errors */
}
```

### Layout Structure
- **Left Sidebar (280px)**: Folder navigation and quick actions
- **Main Content**: Document grid/list and workspace
- **Right Sidebar (380px)**: AI chat interface and context panel

## 🚀 Deployment

### Prerequisites for Deployment
1. **GitHub Account**: For hosting repository
2. **Netlify Account**: For deployment hosting
3. **Domain**: `lilyojuri.com` (already owned)
4. **Supabase Project**: For production database
5. **Anthropic API Key**: For Claude AI functionality

### Quick Deploy to Netlify

1. **Create GitHub Repository**
   ```bash
   # Create repository on GitHub.com first, then:
   git remote add origin https://github.com/yourusername/document-ai-assistant.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Import from Git" → Select GitHub
   - Choose your repository
   - Build settings are configured in `netlify.toml`

3. **Environment Variables (Set in Netlify Dashboard)**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   NODE_ENV=production
   ```

4. **Custom Domain Setup**
   - In Netlify Dashboard → Domain Settings
   - Add custom domain: `lilyojuri.com`
   - Configure DNS records as instructed

### Build Configuration (Already Set)
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18.x (specified in `netlify.toml`)
- **Next.js Plugin**: Auto-configured for optimal performance

## 📋 Development Roadmap

### ✅ Completed: Full Application
- [x] Project setup and basic structure
- [x] Responsive layout with green theme
- [x] Supabase integration and authentication
- [x] Document management system
- [x] Note-taking functionality
- [x] Audio transcription features
- [x] Chat history with persistence
- [x] AI folder creation from chat
- [x] Advanced search and filtering
- [x] Real-time collaboration features
- [x] Deployment configuration

### 🔜 Future Enhancements
- [ ] Vector search implementation
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Bulk import/export functionality
- [ ] Integration with external tools (Jira, Azure DevOps)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Follow the installation steps above
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check our [Documentation](docs/)
- Review [Troubleshooting Guide](docs/troubleshooting.md)

## 🙏 Acknowledgments

- [SAFe Framework](https://scaledagile.com/) for methodology guidance
- [Anthropic Claude](https://claude.ai/) for AI capabilities
- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://prisma.io/) for database management
- [Radix UI](https://radix-ui.com/) for accessible components

---

**Built with ❤️ for Product Owners working in SAFe and Agile environments**
