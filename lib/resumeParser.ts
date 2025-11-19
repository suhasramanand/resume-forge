import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Helper function to split skills while preserving parentheses content
function splitSkillsWithParentheses(text: string): string[] {
  const skills: string[] = [];
  let current = '';
  let parenDepth = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      // Only split on comma if we're not inside parentheses
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        skills.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last skill
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    skills.push(trimmed);
  }
  
  return skills;
}

export interface ParsedResume {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
  summary?: string[];
  skills?: string[];
  projects?: Array<{
    name: string;
    techStack?: string;
    description?: string[];
    dates?: string;
    location?: string;
  }>;
  experience?: Array<{
    role: string;
    company: string;
    dates?: string;
    location?: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    gpa?: string;
    gradDate?: string;
    coursework?: string[];
  }>;
  certifications?: string[];
}

export async function parseResume(file: File): Promise<ParsedResume> {
  const fileType = file.type;
  let rawText = '';

  try {
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      // Ensure Buffer is available (should be in Node.js runtime)
      if (typeof Buffer === 'undefined') {
        throw new Error('Buffer is not available. This function must run in Node.js runtime.');
      }
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      rawText = data.text || '';
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      rawText = result.value || '';
    } else if (fileType === 'text/plain' || fileType === '') {
      // Handle empty type (some browsers don't set it for .txt files)
      rawText = await file.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, DOCX, or TXT.`);
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Could not extract text from the file. The file may be empty or corrupted.');
    }

    return extractResumeData(rawText);
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to parse resume: ${error.toString()}`);
  }
}

function extractResumeData(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const resume: ParsedResume = {
    rawText: text,
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  // Extract name (usually first line or first few lines)
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 50 && !firstLine.includes('@')) {
      resume.name = firstLine;
    }
  }

  // Extract contact info - try multiple formats
  // Strategy 1: Look for contact line with | separators (Format 1: single line with |)
  const contactLinePattern = /([+\d\s().-]+\s*\|\s*[\w.-]+@[\w.-]+\.\w+[^|\n]*(?:\|\s*(?:LinkedIn|GitHub)[^|\n]*)*)/i;
  const contactLineMatch = text.match(contactLinePattern);
  
  if (contactLineMatch) {
    const contactLine = contactLineMatch[1];
    
    // Extract phone
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = contactLine.match(phoneRegex);
    if (phoneMatch) {
      resume.phone = phoneMatch[0];
    }
    
    // Extract email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const emailMatch = contactLine.match(emailRegex);
    if (emailMatch) {
      resume.email = emailMatch[0];
    }
    
    // Extract LinkedIn and GitHub
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const githubRegex = /github\.com\/[\w-]+/gi;
    const linkedinMatch = contactLine.match(linkedinRegex);
    const githubMatch = contactLine.match(githubRegex);
    
    if (linkedinMatch) {
      resume.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
    }
    if (githubMatch) {
      resume.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
    }
  } else {
    // Strategy 2: Look for contact info in first few lines after name (Format 2: multi-line)
    // Check lines 1-5 for contact info, filtering out standalone | characters
    const nameLineIndex = lines.findIndex(l => l === resume.name);
    if (nameLineIndex >= 0 && nameLineIndex < lines.length - 1) {
      const contactLines = lines.slice(nameLineIndex + 1, Math.min(nameLineIndex + 5, lines.length))
        .filter(l => l.trim() !== '|' && l.trim().length > 0); // Filter out standalone | and empty lines
      const contactText = contactLines.join(' ');
      
      // Extract from contact lines
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
      const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
      const githubRegex = /github\.com\/[\w-]+/gi;
      
      const phoneMatch = contactText.match(phoneRegex);
      const emailMatch = contactText.match(emailRegex);
      const linkedinMatch = contactText.match(linkedinRegex);
      const githubMatch = contactText.match(githubRegex);
      
      if (phoneMatch && !resume.phone) {
        resume.phone = phoneMatch[0];
      }
      if (emailMatch && !resume.email) {
        resume.email = emailMatch[0];
      }
      if (linkedinMatch && !resume.linkedin) {
        resume.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
      }
      if (githubMatch && !resume.github) {
        resume.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
      }
    }
    
    // Strategy 3: Fallback - search entire text
    if (!resume.email || !resume.phone) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  const fullText = text.toLowerCase();
  const emails = text.match(emailRegex);
      if (emails && emails.length > 0 && !resume.email) {
    resume.email = emails[0];
  }

  const phones = text.match(phoneRegex);
      if (phones && phones.length > 0 && !resume.phone) {
    resume.phone = phones[0];
  }

  const linkedinMatch = fullText.match(linkedinRegex);
      if (linkedinMatch && !resume.linkedin) {
        resume.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  const githubMatch = fullText.match(githubRegex);
      if (githubMatch && !resume.github) {
        resume.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
      }
    }
  }

  // Extract sections
  let currentSection = '';
  let currentExperience: NonNullable<ParsedResume['experience']>[0] | null = null;
  let currentProject: NonNullable<ParsedResume['projects']>[0] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect section headers
    if (lowerLine.match(/^(summary|objective|profile|about)$/i)) {
      currentSection = 'summary';
      continue;
    } else if (lowerLine.match(/^(skills?|technical skills?|technologies)$/i)) {
      currentSection = 'skills';
      continue;
    } else if (lowerLine.match(/^(projects?|project experience)$/i)) {
      currentSection = 'projects';
      continue;
    } else if (lowerLine.match(/^(experience|work experience|employment|employment history)$/i)) {
      currentSection = 'experience';
      continue;
    } else if (lowerLine.match(/^(education|academic background)$/i)) {
      currentSection = 'education';
      continue;
    } else if (lowerLine.match(/^(certifications?|certificates?|activities?|certifications?\s*[&|]\s*activities?)$/i)) {
      currentSection = 'certifications';
      continue;
    }

    // Process based on current section
    switch (currentSection) {
      case 'summary':
        if (line.length > 20 && !line.match(/^[•\-\*]/)) {
          if (!resume.summary) resume.summary = [];
          resume.summary.push(line);
        }
        break;

      case 'skills':
        // Skip lines that are section headers or contain "Certifications & Activities"
        if (lowerLine.match(/^(certifications?|certificates?|activities?|certifications?\s*[&|]\s*activities?)$/i)) {
          // This is actually a section header, switch to certifications section
          currentSection = 'certifications';
          continue;
        }
        // Try multiple formats for skills parsing
        // Format 1: With bullet points and category headers: • Programming Languages: Python, Java...
        // Format 2: Without bullets but with category headers: Programming Languages: Python, Java...
        // Format 3: Simple comma-separated: Python, Java, JavaScript...
        // Format 4: Single skill or short line
        
        if (line.match(/^[•\-\*●]/) || line.includes(',') || line.includes(':')) {
          let skillsText = line.replace(/^[•\-\*\d.●]+\s*/, '').trim();
          
          // Check if the line contains category headers (multiple formats supported)
          const categoryPattern = /(?:^|,\s*)(Programming\s*Languages?|Web\s*Development|Databases?|Cloud\s*Platform\s*[&|]\s*DevOps\s*Tools?|Programming|Cloud\s*&\s*DevOps|AI\s*&\s*LLMs|Data\s*&\s*Integration|Frontend|Backend|Languages|Frameworks|Tools|Technologies|Infrastructure|DevOps|Cloud)\s*:\s*/gi;
          const categoryMatches: RegExpExecArray[] = [];
          let match;
          while ((match = categoryPattern.exec(skillsText)) !== null) {
            categoryMatches.push(match);
          }
          
          if (categoryMatches.length > 0) {
            // Format 1 & 2: Has category headers - extract skills from each category
            const parts: string[] = [];
            
            categoryMatches.forEach((match, idx) => {
              if (match.index !== undefined) {
                const startPos = match.index + match[0].length;
                const endPos = idx < categoryMatches.length - 1 && categoryMatches[idx + 1].index !== undefined
                  ? categoryMatches[idx + 1].index!
                  : skillsText.length;
                const categorySkills = skillsText.substring(startPos, endPos).trim();
                
                // Handle complex formats like "Frontend - ReactJS, HTML, CSS | Backend - Python (Fast API, Flask), Django"
                // Better handling of parentheses - don't remove them, but handle them properly
                const majorGroups = categorySkills.split('|').map(g => g.trim());
                majorGroups.forEach(group => {
                  if (group.includes(' - ')) {
                    const [prefix, skills] = group.split(' - ', 2);
                    if (skills) {
                      // Split by comma, but be careful with parentheses
                      const skillList = splitSkillsWithParentheses(skills);
                      parts.push(...skillList);
                    }
                  } else {
                    // Just split by comma, handling parentheses
                    const skillList = splitSkillsWithParentheses(group);
                    parts.push(...skillList);
                  }
                });
              }
            });
            
            // Also get skills before the first category (if any)
            if (categoryMatches.length > 0 && categoryMatches[0].index !== undefined && categoryMatches[0].index > 0) {
              const beforeFirst = skillsText.substring(0, categoryMatches[0].index).trim();
              if (beforeFirst.length > 0) {
                const beforeSkills = beforeFirst.split(',').map(s => s.trim()).filter(s => s.length > 0);
                parts.push(...beforeSkills);
              }
            }
            
            if (!resume.skills) resume.skills = [];
            // Filter out category names and invalid entries
            const filteredSkills = parts.filter(s => {
              const lowerS = s.toLowerCase();
              return s.length > 0 && 
                     s.length < 100 &&
                     !lowerS.match(/^(certifications?|certificates?|activities?)$/i) &&
                     !lowerS.includes('certifications') && 
                     !lowerS.includes('certificates') &&
                     !(lowerS.includes('certification') && lowerS.includes('activity')) &&
                     !lowerS.match(/^(programming\s*languages?|web\s*development|databases?|cloud\s*platform|programming|cloud\s*&\s*devops|ai\s*&\s*llms|data\s*&\s*integration|frontend|backend|languages|frameworks|tools|technologies|infrastructure|devops|cloud):?$/i);
            });
            resume.skills.push(...filteredSkills);
          } else {
            // Format 3: No category headers, just comma-separated skills
            // Use the helper function to properly handle parentheses
            const skills = splitSkillsWithParentheses(skillsText);
          if (!resume.skills) resume.skills = [];
            const filteredSkills = skills.filter(s => {
              const lowerS = s.toLowerCase();
              return s.length > 0 && 
                     s.length < 100 &&
                     !lowerS.match(/^(certifications?|certificates?|activities?)$/i) &&
                     !lowerS.includes('certifications') && 
                     !lowerS.includes('certificates') &&
                     !(lowerS.includes('certification') && lowerS.includes('activity'));
            });
            resume.skills.push(...filteredSkills);
          }
        } else if (line.length > 0 && line.length < 100 && !line.match(/^[A-Z]{2,}/)) {
          // Format 4: Single skill or short line (not all caps which might be a section header)
          const lowerS = line.toLowerCase();
          if (!lowerS.match(/^(certifications?|certificates?|activities?|certifications?\s*[&|]\s*activities?)$/i) &&
              !lowerS.includes('certifications') && 
              !lowerS.includes('certificates') &&
              !(lowerS.includes('certification') && lowerS.includes('activity'))) {
          if (!resume.skills) resume.skills = [];
          resume.skills.push(line);
          }
        }
        break;

      case 'projects':
        // Multiple formats for project detection
        // Format 1: Project name only (e.g., "Image Processing Application")
        // Format 2: Project name with dates (e.g., "Image Processing Application Aug 2024 - Dec 2024")
        // Format 3: Project name | Tech stack
        // Format 4: Project name | Tech stack | Dates
        
        // Check if line is a project name (starts with capital, reasonable length, not a bullet)
        const isProjectName = line.match(/^[A-Z]/) && 
                              line.length < 200 && 
                              !line.match(/^[•\-\*●]/) &&
                              !line.match(/^(WORK|EDUCATION|TECHNICAL|SKILLS|PROJECTS|EXPERIENCE|CERTIFICATIONS)/i);
        
        if (isProjectName) {
          // Check if it has a pipe (Format 3 or 4)
          if (line.includes('|')) {
            if (currentProject) {
              resume.projects!.push(currentProject);
            }
            const parts = line.split('|').map(p => p.trim());
            // Extract dates if present
            const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
            let projectName = parts[0];
            let techStack = parts[1] || '';
            let dates = '';
            
            // Check if dates are in any part
            for (const part of parts) {
              const dateMatch = part.match(datePattern);
              if (dateMatch) {
                dates = dateMatch[0];
                // Remove dates from the part
                if (part === projectName) {
                  projectName = projectName.replace(datePattern, '').trim();
                } else if (part === techStack) {
                  techStack = techStack.replace(datePattern, '').trim();
                }
              }
            }
            
            currentProject = {
              name: projectName,
              techStack: techStack,
              dates: dates || undefined,
              description: [],
            };
          } else {
            // Format 1 or 2: Project name with or without dates
            // Check if line has dates at the end
            const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
            const dateMatch = line.match(datePattern);
            
            if (dateMatch) {
              // Format 2: Has dates
              if (currentProject) {
                resume.projects!.push(currentProject);
              }
              const projectName = line.replace(datePattern, '').trim();
              currentProject = {
                name: projectName,
                techStack: '',
                dates: dateMatch[0],
                description: [],
              };
            } else {
              // Format 1: Just project name
          if (currentProject) {
            resume.projects!.push(currentProject);
          }
          currentProject = {
            name: line.trim(),
            techStack: '',
            description: [],
          };
            }
          }
        } else if (currentProject) {
          // This is a description line for the current project
          // But first check if this is actually a new project name (starts with capital, has date pattern)
          const projectNameWithDatePattern = /^([A-Z][A-Za-z\s&,.-]+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i;
          const projectNameMatch = line.match(projectNameWithDatePattern);
          
          if (projectNameMatch && line.length < 150) {
            // This is actually a new project, not a description
            resume.projects!.push(currentProject);
          currentProject = {
              name: projectNameMatch[1].trim(),
              techStack: '',
              dates: projectNameMatch[2],
            description: [],
          };
          } else if (line.match(/^[•\-\*●]/)) {
            // Bullet point
            currentProject.description!.push(line.replace(/^[•\-\*\d.●]+\s*/, ''));
          } else if (line.length > 10 && !line.match(/^[A-Z]{2,}/)) {
            // Regular description (not all caps which might be a section header)
          currentProject.description!.push(line.trim());
          } else if (line.match(/^[A-Z]/) && line.length < 50) {
            // Might be a date range on its own line
            const datePattern = /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i;
            const dateMatch = line.match(datePattern);
            if (dateMatch && !currentProject.dates) {
              currentProject.dates = dateMatch[1];
            }
          }
        }
        break;

      case 'experience':
        // Look for role/company pattern with better date detection
        // Pattern: Company | Role | Dates or Role | Company | Dates
        const expPipeMatch = line.match(/^([^|]+)\s*\|\s*([^|]+)(?:\s*\|\s*(.+))?$/);
        const expAtMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+?)$/i);
        const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:[-–—]\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})?/i;
        const datePattern2 = /\b\d{4}\s*(?:[-–—]\s*(?:Present|Current|\d{4}))?/;
        
        if (expPipeMatch) {
          if (currentExperience) {
            resume.experience!.push(currentExperience);
          }
          const [, part1, part2, part3] = expPipeMatch;
          // Check which part contains dates
          let role = part1.trim();
          let company = part2.trim();
          let dates = part3?.trim() || '';
          
          // Extract dates from any part first (before cleaning)
          const allParts = [part1, part2, part3].filter(p => p);
          for (const part of allParts) {
            // Look for date ranges like "Jun 2025 - Aug 2025" or "Oct 2023 - Jul 2024"
            const dateRangeMatch = part.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
            if (dateRangeMatch) {
              dates = dateRangeMatch[1].trim();
              // Remove dates from the part they came from
              if (part === part1) {
                role = part1.replace(dateRangeMatch[0], '').trim().replace(/\s*,\s*$/, '');
              } else if (part === part2) {
                company = part2.replace(dateRangeMatch[0], '').trim();
              }
              break;
            }
            // Look for single dates
            const dateMatch = part.match(datePattern) || part.match(datePattern2);
            if (dateMatch) {
              dates = dateMatch[0].trim();
              // Remove dates from the part they came from
              if (part === part1) {
                role = part1.replace(datePattern, '').replace(datePattern2, '').trim().replace(/\s*,\s*$/, '');
              } else if (part === part2) {
                company = part2.replace(datePattern, '').replace(datePattern2, '').trim();
              }
              break;
            }
          }
          
          // Extract dates from role if attached (e.g., "Project TraineeJan 2023" or "Intern, CloudJun 2025" or "EngineerOct")
          // First, try to extract dates that are attached directly to words (no space)
          const attachedDatePattern = /([A-Za-z]+?)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}?)/i;
          const roleAttachedDateMatch = role.match(attachedDatePattern);
          if (roleAttachedDateMatch && !dates) {
            const [, wordBeforeDate, datePart] = roleAttachedDateMatch;
            // Check if the date part is valid (has year or is a month name)
            if (datePart.match(/\d{4}/) || datePart.length >= 3) {
              // Extract full date if possible
              const fullDateMatch = role.match(new RegExp(`(${wordBeforeDate})((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s*\\d{4})`, 'i'));
              if (fullDateMatch) {
                dates = fullDateMatch[2].trim();
                role = fullDateMatch[1].trim();
              } else {
                // Just remove the month abbreviation
                role = role.replace(new RegExp(`(${wordBeforeDate})((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)`, 'i'), '$1');
              }
            }
          }
          
          // Extract dates from role if attached with space (e.g., "Project TraineeJan 2023" or "Intern, CloudJun 2025")
          if (!dates) {
            const roleDateMatch = role.match(/(.+?)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:[-–—]\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})?)/i);
            if (roleDateMatch) {
              dates = roleDateMatch[2].trim();
              role = roleDateMatch[1].trim().replace(/\s*,\s*$/, '');
            }
          }
          
          // Determine which is company and which is role
          // Usually: Company | Role | Dates
          // But sometimes: Role | Company | Dates
          // Check if part1 looks like a company name (capitalized, no common role words)
          const roleKeywords = /(intern|engineer|developer|trainee|manager|analyst|consultant|specialist|lead|senior|junior|associate)/i;
          let finalRole = role;
          let finalCompany = company;
          
          if (roleKeywords.test(part1) && !roleKeywords.test(part2)) {
            // part1 is role, part2 is company
            finalRole = part1.trim();
            finalCompany = part2.trim();
          } else {
            // part1 is company, part2 is role
            finalCompany = part1.trim();
            finalRole = part2.trim();
          }
          
          // Remove duplicate company names
          if (finalCompany === finalRole || (part1 === part2 && part1)) {
            // If company and role are the same, or part1 equals part2, likely duplicate
            // Try to extract role from the end
            const roleMatch = finalRole.match(/(.+?)\s+(Software Engineer|Project Trainee|Intern|Developer|Engineer|Manager|Analyst|Consultant|Specialist|Lead|Senior|Junior|Associate|Trainee)/i);
            if (roleMatch) {
              finalCompany = roleMatch[1].trim();
              finalRole = roleMatch[2].trim();
            } else if (part1 === part2) {
              // If both parts are identical, use first as company, second as role (if it has role keywords)
              finalCompany = part1.trim();
              finalRole = part3?.trim() || '';
            }
          }
          
          // Now clean up the final role and company - remove date patterns, trailing dashes, and attached month abbreviations
          finalRole = finalRole.replace(datePattern, '').replace(datePattern2, '').trim();
          finalRole = finalRole.replace(/\s*[-–—]\s*$/, '').replace(/\s*,\s*$/, '').trim();
          // Remove month abbreviations that might be attached (e.g., "CloudJun" -> "Cloud", "EngineerOct" -> "Engineer")
          finalRole = finalRole.replace(/([A-Za-z]+?)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)$/i, '$1').trim();
          
          finalCompany = finalCompany.replace(datePattern, '').replace(datePattern2, '').trim();
          finalCompany = finalCompany.replace(/\s*[-–—]\s*$/, '').replace(/\s*,\s*$/, '').trim();
          
          role = finalRole;
          company = finalCompany;
          
          // Clean up dates - remove trailing dashes
          const cleanedDates = dates ? dates.replace(/\s*[-–—]\s*$/, '').trim() : '';
          
          currentExperience = {
            role: role,
            company: company,
            dates: cleanedDates,
            bullets: [],
          };
        } else if (expAtMatch) {
          if (currentExperience) {
            resume.experience!.push(currentExperience);
          }
          currentExperience = {
            role: expAtMatch[1].trim(),
            company: expAtMatch[2].trim(),
            bullets: [],
          };
        } else if (currentExperience) {
          // This line is part of the current experience entry
          // Check if this line is a date range (e.g., "Jun 2025 - Aug 2025")
          const dateRangeMatch = line.match(/^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i);
          if (dateRangeMatch && !currentExperience.dates) {
            // This line is a date range, add it to dates
            currentExperience.dates = dateRangeMatch[1].trim();
          } else if (line.match(/^[•\-\*●]/)) {
            // Bullet point - check if previous bullet was incomplete (doesn't end with punctuation)
            const bulletText = line.replace(/^[•\-\*\d.●]+\s*/, '');
            if (currentExperience.bullets.length > 0) {
              const lastBullet = currentExperience.bullets[currentExperience.bullets.length - 1];
              // If last bullet doesn't end with punctuation and this line doesn't start with capital, merge them
              if (!lastBullet.match(/[.!?]$/) && !bulletText.match(/^[A-Z]/) && lastBullet.length < 100) {
                currentExperience.bullets[currentExperience.bullets.length - 1] = lastBullet + ' ' + bulletText;
              } else {
                currentExperience.bullets.push(bulletText);
              }
            } else {
              currentExperience.bullets.push(bulletText);
            }
          } else if (!line.match(/^[A-Z]/) && line.length > 10) {
            // Sometimes bullets don't have bullet points - check if this continues previous bullet
            if (currentExperience.bullets.length > 0) {
              const lastBullet = currentExperience.bullets[currentExperience.bullets.length - 1];
              // If last bullet doesn't end with punctuation, merge them
              if (!lastBullet.match(/[.!?]$/) && lastBullet.length < 100) {
                currentExperience.bullets[currentExperience.bullets.length - 1] = lastBullet + ' ' + line.trim();
              } else {
                currentExperience.bullets.push(line.trim());
              }
            } else {
          currentExperience.bullets.push(line.trim());
            }
          }
        } else {
          // No current experience, but this might be a new experience entry in a different format
          // Try to detect: "Company | Role" or "Role | Company" without dates
          const simpleExpMatch = line.match(/^([^|]+)\s*\|\s*([^|]+)$/);
          if (simpleExpMatch && line.length < 150) {
            const [, part1, part2] = simpleExpMatch;
            const roleKeywords = /(intern|engineer|developer|trainee|manager|analyst|consultant|specialist|lead|senior|junior|associate|developer|intern)/i;
            
            let company = part1.trim();
            let role = part2.trim();
            
            // Determine which is company and which is role
            if (roleKeywords.test(part1) && !roleKeywords.test(part2)) {
              role = part1.trim();
              company = part2.trim();
            }
            
            // Clean up
            company = company.replace(/\s*[-–—]\s*$/, '').trim();
            role = role.replace(/\s*[-–—]\s*$/, '').trim();
            
            if (company && role && company.length > 2 && role.length > 2) {
              if (currentExperience) {
                resume.experience!.push(currentExperience);
              }
              currentExperience = {
                role: role,
                company: company,
                bullets: [],
              };
            }
          }
        }
        break;

      case 'education':
        // Strategy 1: Handle education entries with bullet points (Format 1: ● Master of Science, Computer Science | Northeastern University | GPA: 4.0/4.0)
        if (line.match(/^[●•\-\*]/)) {
          const eduLine = line.replace(/^[●•\-\*\d.]+\s*/, '').trim();
          const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
          const datePattern2 = /\b\d{4}\b/;
          const gpaPattern = /\b(GPA|G\.P\.A\.?)\s*:?\s*([\d./]+)/i;
          const degreePattern = /\b(Master|Bachelor|M\.?S\.?|B\.?S\.?|B\.?Tech|Ph\.?D\.?|Doctorate)[\s\w,&-]*/i;
          const universityPattern = /([A-Z][A-Za-z\s&,.-]+(?:University|College|Institute|School|Academy))/;
          
          const parts = eduLine.split('|').map(p => p.trim());
          let institution = '';
          let degree = '';
          let gpa = '';
          let gradDate = '';
          
          // Find institution
          for (const part of parts) {
            const uniMatch = part.match(universityPattern);
            if (uniMatch) {
              institution = uniMatch[1].trim();
              break;
            }
          }
          
          // Find degree
          for (const part of parts) {
            const degMatch = part.match(degreePattern);
            if (degMatch && degMatch[0]) {
              degree = degMatch[0].trim();
              break;
            }
          }
          
          // Find GPA
          const gpaMatch = eduLine.match(gpaPattern);
          if (gpaMatch && gpaMatch[2]) {
            gpa = gpaMatch[2].trim();
          }
          
          // Find dates
          for (const part of parts) {
            if (datePattern.test(part) || datePattern2.test(part)) {
              gradDate = part;
              break;
            }
          }
          
          if (institution || degree) {
            if (!resume.education) resume.education = [];
            // Check for duplicates
            const isDup = resume.education.some(e => 
              (e.institution && institution && e.institution.toLowerCase() === institution.toLowerCase()) ||
              (e.degree && degree && e.degree && e.degree.toLowerCase() === degree.toLowerCase())
            );
            if (!isDup && institution) {
              resume.education.push({
                institution: institution,
                degree: degree || undefined,
                gpa: gpa || undefined,
                gradDate: gradDate || undefined,
                coursework: [],
              });
            }
          }
        } 
        // Strategy 2: Handle regular education entries (Format 2: Northeastern University | M.S., Computer Software Engineering | GPA: 3.8)
        // Also handles: University | Degree | GPA on one line, then GPA: X and Dates on next lines
        else if (line.match(/^[A-Z]/) && line.length < 200) {
          // Check if this line contains multiple education entries (separated by | or on same line)
          // Example: "Northeastern University | M.S., Computer Software Engineering (GPA: 3.8) REVA University | B.Tech..."
          const pipeSplit = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
          
          // Look ahead to next lines for GPA and dates if they're not in the main line
          let nextLineGPA = '';
          let nextLineDate = '';
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const gpaPattern = /\b(GPA|G\.P\.A\.?)\s*:?\s*([\d./]+)/i;
            const gpaMatch = nextLine.match(gpaPattern);
            if (gpaMatch && gpaMatch[2]) {
              nextLineGPA = gpaMatch[2].trim();
            }
            const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
            const dateMatch = nextLine.match(datePattern);
            if (dateMatch) {
              nextLineDate = dateMatch[0].trim();
            }
          }
          
          // If line has multiple parts separated by |, try to parse each as separate education entry
          if (pipeSplit.length >= 2) {
            const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
            const datePattern2 = /\b\d{4}\b/;
            const gpaPattern = /\b(GPA|G\.P\.A\.?)\s*:?\s*\(?([\d.]+)\)?/i;
            const degreePattern = /\b(M\.?S\.?|B\.?S\.?|B\.?Tech|Bachelor|Master|Ph\.?D\.?|Doctorate)[\s\w,&-]*/i;
            const universityPattern = /([A-Z][A-Za-z\s&,.-]+(?:University|College|Institute|School|Academy))/;
            
            if (!resume.education) resume.education = [];
            
            // Try to extract multiple education entries from this line
            let currentInst = '';
            let currentDegree = '';
            let currentGPA = '';
            let currentDate = '';
            
            for (let j = 0; j < pipeSplit.length; j++) {
              const part = pipeSplit[j];
              
              // Check if this part is a university name
              const uniMatch = part.match(universityPattern);
              if (uniMatch) {
                // Save previous entry if we have one
                if (currentInst && currentInst.length > 2) {
                  const isDup = resume.education.some(e => 
                    e.institution && currentInst && 
                    (e.institution.toLowerCase() === currentInst.toLowerCase() ||
                     e.institution.toLowerCase().includes(currentInst.toLowerCase()) ||
                     currentInst.toLowerCase().includes(e.institution.toLowerCase()))
                  );
                  if (!isDup) {
                    resume.education.push({
                      institution: currentInst,
                      degree: currentDegree || undefined,
                      gpa: currentGPA || nextLineGPA || undefined,
                      gradDate: currentDate || nextLineDate || undefined,
                      coursework: [],
                    });
                  }
                }
                // Start new entry
                currentInst = uniMatch[1].trim();
                currentDegree = '';
                currentGPA = '';
                currentDate = '';
              } else {
                // This part might be degree, GPA, or date
                const degMatch = part.match(degreePattern);
                const gpaMatch = part.match(gpaPattern);
                const dateMatch = part.match(datePattern) || part.match(datePattern2);
                
                if (degMatch && !currentDegree) {
                  currentDegree = degMatch[0].replace(gpaPattern, '').trim();
                }
                if (gpaMatch && !currentGPA) {
                  currentGPA = gpaMatch[2];
                }
                if (dateMatch && !currentDate) {
                  currentDate = dateMatch[0];
                }
              }
            }
            
            // Save last entry
            if (currentInst && currentInst.length > 2) {
              const isDup = resume.education.some(e => 
                e.institution && currentInst && 
                (e.institution.toLowerCase() === currentInst.toLowerCase() ||
                 e.institution.toLowerCase().includes(currentInst.toLowerCase()) ||
                 currentInst.toLowerCase().includes(e.institution.toLowerCase()))
              );
              if (!isDup) {
                resume.education.push({
                  institution: currentInst,
                  degree: currentDegree || undefined,
                  gpa: currentGPA || nextLineGPA || undefined,
                  gradDate: currentDate || nextLineDate || undefined,
                  coursework: [],
                });
              }
            }
          } else {
            // Single education entry parsing (original logic)
            const parts = pipeSplit;
            const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i;
            const datePattern2 = /\b\d{4}\b/;
            const gpaPattern = /\b(GPA|G\.P\.A\.?)\s*:?\s*\(?([\d.]+)\)?/i;
            
            let institution = parts[0] || '';
            let degree = '';
            let gpa = '';
            let gradDate = '';
            
            // Extract GPA
            const gpaMatch = line.match(gpaPattern);
            if (gpaMatch) {
              gpa = gpaMatch[2]; // Just the number
            }
            
            // Extract dates from any part
            for (const part of parts) {
              if (datePattern.test(part) || datePattern2.test(part)) {
                gradDate = part;
                break;
              }
            }
            
            // Extract degree (usually contains "M.S.", "B.Tech", "Bachelor", "Master", etc.)
            const degreePattern = /\b(M\.?S\.?|B\.?S\.?|B\.?Tech|Bachelor|Master|Ph\.?D\.?|Doctorate)[\s\w,&-]*/i;
            for (const part of parts) {
              if (degreePattern.test(part)) {
                degree = part.replace(gpaPattern, '').trim();
                break;
              }
            }
            
            // If no degree found, check if institution is actually a degree
            if (!degree && parts.length > 1) {
              degree = parts[1];
            }
            
            // Clean up
            institution = institution.replace(gpaPattern, '').replace(degreePattern, '').trim();
            degree = degree.replace(gpaPattern, '').trim();
            
            if (!resume.education) resume.education = [];
            
            // Check for duplicates - more strict matching
            const isDuplicate = resume.education.some(e => {
              // Check if institution matches (case-insensitive, partial match)
              const instMatch = e.institution && institution && 
                (e.institution.toLowerCase() === institution.toLowerCase() ||
                 e.institution.toLowerCase().includes(institution.toLowerCase()) ||
                 institution.toLowerCase().includes(e.institution.toLowerCase()));
              
              // Check if degree matches (case-insensitive, partial match)
              const degMatch = (!e.degree && !degree) || 
                (e.degree && degree && 
                 (e.degree.toLowerCase() === degree.toLowerCase() ||
                  e.degree.toLowerCase().includes(degree.toLowerCase()) ||
                  degree.toLowerCase().includes(e.degree.toLowerCase())));
              
              // Check if date matches
              const dateMatch = (!e.gradDate && !gradDate) ||
                (e.gradDate && gradDate && e.gradDate === gradDate);
              
              // Check if GPA matches
              const gpaMatch = (!e.gpa && !gpa) ||
                (e.gpa && gpa && e.gpa === gpa);
              
              // If institution matches and at least one other field matches, it's a duplicate
              return instMatch && (degMatch || dateMatch || gpaMatch);
            });
            
            // Also check if this line is just a combination of already-parsed fields
            const isCombinedLine = resume.education.some(e => {
              if (!e.institution || !institution) return false;
              const hasInst = line.includes(e.institution);
              const hasDegree = e.degree && line.includes(e.degree);
              const hasGPA = e.gpa && line.includes(e.gpa);
              const hasDate = e.gradDate && line.includes(e.gradDate);
              
              // If line contains multiple already-parsed fields, it's a combined/duplicate line
              return hasInst && (hasDegree || hasGPA || hasDate);
            });
            
            if (!isDuplicate && !isCombinedLine && institution && institution.length > 2) {
              resume.education.push({
                institution: institution,
                degree: degree || undefined,
                gpa: gpa || undefined,
                gradDate: gradDate || undefined,
                coursework: [],
              });
            }
          }
        }
        break;

      case 'certifications':
        if (line.match(/^[•\-\*]/) || line.length > 0) {
          if (!resume.certifications) resume.certifications = [];
          resume.certifications.push(line.replace(/^[•\-\*\d.]+\s*/, ''));
        }
        break;
    }
  }

  // Push last items
  if (currentExperience) {
    resume.experience!.push(currentExperience);
  }
  if (currentProject) {
    resume.projects!.push(currentProject);
  }
  
  // Validate and filter out invalid entries
  if (resume.experience && resume.experience.length > 0) {
    resume.experience = resume.experience.filter(exp => 
      exp.company && exp.company.length > 0 && 
      exp.role && exp.role.length > 0
    );
  }
  
  if (resume.projects && resume.projects.length > 0) {
    resume.projects = resume.projects.filter(proj => 
      proj.name && proj.name.length > 0
    );
  }

  return resume;
}

