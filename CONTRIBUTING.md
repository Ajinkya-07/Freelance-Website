# Contributing to EditFlow

First off, thank you for considering contributing to EditFlow! It's people like you that make EditFlow such a great platform.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots if possible**
* **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain the behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Follow the coding style guide
* Include screenshots in your pull request whenever possible
* End all files with a newline
* Write clear, descriptive commit messages

## Development Process

### Setting Up Your Development Environment

1. Fork the repo and create your branch from `main`
2. Clone your fork locally
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Set up environment variables (see .env.example files)
5. Run the development servers

### Coding Style Guide

#### Backend (Node.js/Express)

* Use 2 spaces for indentation
* Use semicolons
* Use camelCase for variables and functions
* Use PascalCase for classes
* Add JSDoc comments for functions
* Follow ESLint rules
* Use async/await instead of callbacks
* Handle errors properly with try-catch

Example:
```javascript
/**
 * Create a new job posting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createJob = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  
  // Your code here
  
  res.status(201).json({ success: true, data: job });
});
```

#### Frontend (React)

* Use 2 spaces for indentation
* Use functional components with hooks
* Use PascalCase for component names
* Use camelCase for functions and variables
* Use descriptive variable names
* Follow ESLint rules
* Add PropTypes or TypeScript types when possible

Example:
```jsx
const JobCard = ({ job, onSelect }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await onSelect(job.id);
    setLoading(false);
  };
  
  return (
    <div onClick={handleClick}>
      {/* Your JSX here */}
    </div>
  );
};
```

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Examples:
```
Add user authentication middleware
Fix job creation validation bug
Update README with deployment instructions
Refactor proposal submission logic
```

### Testing

* Write tests for new features
* Ensure all tests pass before submitting PR
* Maintain or improve code coverage

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Documentation

* Update README.md if needed
* Add JSDoc comments for new functions
* Update API documentation (Swagger) for API changes
* Add inline comments for complex logic

## Project Structure

### Backend
```
backend/src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
└── utils/           # Utility functions
```

### Frontend
```
frontend/src/
├── api/            # API client
├── components/     # Reusable components
├── context/        # React Context
├── pages/          # Page components
└── assets/         # Static assets
```

## Review Process

1. **Code Review**: All submissions require review
2. **Automated Checks**: Must pass linting and tests
3. **Testing**: Manually test your changes
4. **Documentation**: Update relevant documentation
5. **Approval**: Requires approval from maintainers

## Recognition

Contributors will be recognized in:
* README.md contributors section
* Release notes
* GitHub contributors page

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EditFlow! 🎉
