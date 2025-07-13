# Contributing to TradeFlow

Thank you for your interest in contributing to TradeFlow! We welcome contributions from the community and are excited to see what you'll build.

## 🎯 Project Overview

TradeFlow is an AI-powered workflow optimization tool for independent tradespeople. It brings the "Cursor experience" to contractors, helping them maximize revenue-generating "wrench time" by optimizing scheduling, routing, and inventory management.

## 🤝 How to Contribute

### Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Set up your development environment** following the README instructions
4. **Create a feature branch** following our naming conventions

### Development Process

We follow a **feature-branch workflow** with the following conventions:

#### Branch Naming
- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-bug`
- Documentation: `docs/description-of-change`
- Phase-specific work: `feature/phase-XX-feature-name-owner`

#### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issues when applicable (e.g., "Fix inventory sync issue #123")

### Code Standards

#### TypeScript & Code Quality
- **All code must be TypeScript** with proper type definitions
- **File naming conventions**:
  - React components: `PascalCase` (e.g., `JobCard.tsx`)
  - Hooks, utils, services: `camelCase` (e.g., `useJobs.ts`, `mapUtils.ts`)
- **File headers**: Every `.ts` and `.tsx` file must begin with a block comment explaining the file's purpose
- **Function documentation**: All exported functions must have TSDoc comments
- **File length limit**: No file should exceed 500 lines

#### Architecture Patterns
- **State Management**: Use Jotai for UI state, TanStack Query for server state
- **Component Structure**: 
  - `/components/ui/` - Primitive UI building blocks
  - `/components/` - Higher-level composed components
- **Services**: Abstract external API calls into `/services/` directory
- **No direct Supabase calls** from UI components - use service abstractions

#### UI/UX Standards
- **Design Philosophy**: "Friendly Professional" - trustworthy, clear, efficient
- **Colors**: Always use colors from `@/constants/Colors` - never hardcode colors
- **Components**: Check existing components in `/components/` and `/components/ui/` before creating new ones
- **Responsive Design**: Use `StyleSheet.create` for all styling
- **Accessibility**: Follow React Native accessibility guidelines

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following our coding standards
3. **Test thoroughly** - ensure your changes don't break existing functionality
4. **Update documentation** if you're adding new features or changing APIs
5. **Submit a pull request** with:
   - Clear description of what you've changed
   - Screenshots for UI changes
   - Reference to any related issues

#### Pull Request Requirements
- **At least one peer review** required before merging
- **All CI checks must pass**
- **Branch must be up to date** with main before merging
- **Squash and rebase** - we maintain a clean git history

### Team Roles & Responsibilities

Our team is organized into three distinct domains:

| **Role** | **Core Responsibilities** | **Description** |
| :--- | :--- | :--- |
| **Frontend & UX Lead** | React Native, UI/UX, Expo Router, component development | Building Experiences |
| **Backend & Data Lead** | TanStack Query, Supabase, database, API integration | Managing Data |
| **AI & Systems Lead** | Edge functions, LLM prompts, AI-powered route optimization | The Brain |

### Project Structure

```
mobile/
├── _docs/           # All project documentation
├── app/             # Screens and navigation (Expo Router)
├── assets/          # Static assets (fonts, images)
├── components/      # Reusable React components
│   └── ui/          # Primitive UI building blocks
├── constants/       # App-wide constants (Colors, etc.)
├── hooks/           # Custom React hooks
├── services/        # External service abstractions
├── store/           # Global state management (Jotai)
├── supabase/        # Supabase configuration and edge functions
│   ├── functions/   # Edge functions (dispatcher, inventory)
│   └── migrations/  # Database migrations
└── utils/           # Pure utility functions
```

### Development Phases

We're following a structured development approach:

1. **Phase 1**: Foundational Setup & Architecture
2. **Phase 2**: MVP - The Core AI Workflow
3. **Phase 3**: Polish & Advanced Features

Check the `_docs/phases/` directory for detailed phase specifications.

### Issue Guidelines

When creating issues:
- **Use our issue templates** for bug reports and feature requests
- **Provide clear reproduction steps** for bugs
- **Include relevant context** (device, OS, app version)
- **Search existing issues** before creating new ones

### Code Review Guidelines

When reviewing pull requests:
- **Check for architectural consistency** with our patterns
- **Verify TypeScript types** are properly defined
- **Test the changes** on your local environment
- **Provide constructive feedback** with specific suggestions
- **Approve only when ready** - don't approve placeholder PRs

### Security Guidelines

- **Never commit sensitive data** (API keys, passwords, etc.)
- **Use environment variables** for configuration
- **Follow Supabase RLS best practices**
- **Validate all user inputs**

### Performance Guidelines

- **Use FlatList or FlashList** for long lists
- **Memoize expensive components** with React.memo
- **Optimize map rendering** with clustering for large datasets
- **Follow React Native performance best practices**

### Testing (Future)

While E2E testing is deferred to Phase 3, we encourage:
- **Manual testing** of all changes
- **Cross-platform testing** (iOS/Android/Web)
- **Edge case testing** for user flows

## 🚀 Getting Help

- **Documentation**: Check the `_docs/` directory for detailed guides
- **Issues**: Search existing issues or create a new one
- **Architecture Questions**: Review `_docs/tech-stack.md` and `_docs/project-rules.md`
- **UI/UX Guidelines**: See `_docs/ui-rules.md` and `_docs/theme-rules.md`

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Recognition & Community

### How We Recognize Contributors

We believe in celebrating everyone who contributes to TradeFlow:

#### Automatic Recognition
- **First PR merged**: Welcome message and mention in release notes
- **Bug fixes**: Acknowledged in issue comments and release notes
- **Documentation improvements**: Highlighted in community updates
- **Code contributions**: Added to README contributors section

---

**Remember**: We're building a tool to amplify tradesperson capability, not replace human judgment. Every contribution should serve the goal of maximizing "wrench time" while maintaining human oversight and control.

Thank you for helping us build the future of trade workflow optimization! 🚀 