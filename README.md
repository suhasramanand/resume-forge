# Dynamic Resume Formatter Engine

Convert any uploaded resume (any length, any format) into a clean, single-page, ATS-ready resume with interactive editing controls for every line.

## Features

- **Universal Resume Parsing**: Supports PDF, DOCX, DOC, and TXT formats
- **One-Page Compression**: Automatically compresses content to fit one page
- **Interactive Editing**: Add, remove, edit, or reorder every line
- **ATS-Ready Format**: Clean, structured format optimized for Applicant Tracking Systems
- **Real-time Updates**: See changes instantly as you edit

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Usage

1. Upload a resume file (PDF, DOCX, DOC, or TXT)
2. The system will automatically parse and format it into the one-page template
3. Use the interactive controls to edit any line:
   - **Add**: Add a new line below
   - **Remove**: Delete the line
   - **Edit**: Modify the line content
   - **↑/↓**: Move the line up or down
4. Click "Finalize & Download" when done

## Format Structure

- **Header**: Name and contact information
- **Summary**: 2-3 value-driven lines
- **Skills**: Category-based (Languages, Cloud, DevOps, etc.)
- **Projects**: Name, tech stack, and concise bullets
- **Experience**: Role, company, dates, and quantifiable bullets
- **Education**: Degree, institution, graduation date
- **Certifications**: Optional section

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- pdf-parse (PDF parsing)
- mammoth (DOCX parsing)
- react-dropzone (file upload)

