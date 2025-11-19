import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

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

  // Extract contact info
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  const fullText = text.toLowerCase();
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    resume.email = emails[0];
  }

  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    resume.phone = phones[0];
  }

  const linkedinMatch = fullText.match(linkedinRegex);
  if (linkedinMatch) {
    resume.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `linkedin.com/in/${linkedinMatch[0].split('/in/')[1] || linkedinMatch[0]}`;
  }

  const githubMatch = fullText.match(githubRegex);
  if (githubMatch) {
    resume.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `github.com/${githubMatch[0].split('/')[1] || githubMatch[0]}`;
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
    } else if (lowerLine.match(/^(certifications?|certificates?)$/i)) {
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
        if (line.match(/^[•\-\*]/) || line.includes(',')) {
          const skills = line.replace(/^[•\-\*\d.]+\s*/, '').split(/[,|]/).map(s => s.trim());
          if (!resume.skills) resume.skills = [];
          resume.skills.push(...skills.filter(s => s.length > 0));
        } else if (line.length > 0 && line.length < 100) {
          if (!resume.skills) resume.skills = [];
          resume.skills.push(line);
        }
        break;

      case 'projects':
        // Better project detection - project name usually starts with capital and is short
        if (line.match(/^[A-Z]/) && line.length < 120 && !line.match(/^[•\-\*]/) && !line.match(/\|/)) {
          if (currentProject) {
            resume.projects!.push(currentProject);
          }
          currentProject = {
            name: line.trim(),
            techStack: '',
            description: [],
          };
        } else if (line.match(/^[A-Z]/) && line.includes('|') && line.length < 120) {
          // Project with tech stack
          if (currentProject) {
            resume.projects!.push(currentProject);
          }
          const parts = line.split('|');
          currentProject = {
            name: parts[0].trim(),
            techStack: parts[1]?.trim() || '',
            description: [],
          };
        } else if (currentProject && line.match(/^[•\-\*]/)) {
          currentProject.description!.push(line.replace(/^[•\-\*\d.]+\s*/, ''));
        } else if (currentProject && line.length > 10 && !line.match(/^[A-Z]/)) {
          // Sometimes project descriptions don't have bullet points
          currentProject.description!.push(line.trim());
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
          
          // Extract dates from role if attached (e.g., "Project TraineeJan 2023" or "Intern, CloudJun 2025")
          if (!dates) {
            const roleDateMatch = role.match(/(.+?)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:[-–—]\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})?)/i);
            if (roleDateMatch) {
              dates = roleDateMatch[2].trim();
              role = roleDateMatch[1].trim().replace(/\s*,\s*$/, '');
            }
          }
          
          // Clean up role - remove any remaining date patterns
          role = role.replace(datePattern, '').replace(datePattern2, '').trim().replace(/\s*,\s*$/, '');
          // Clean up company - remove any remaining date patterns
          company = company.replace(datePattern, '').replace(datePattern2, '').trim();
          
          // Determine which is company and which is role
          // Usually: Company | Role | Dates
          // But sometimes: Role | Company | Dates
          // Check if part1 looks like a company name (capitalized, no common role words)
          const roleKeywords = /(intern|engineer|developer|trainee|manager|analyst|consultant|specialist|lead|senior|junior|associate)/i;
          if (roleKeywords.test(part1) && !roleKeywords.test(part2)) {
            // part1 is role, part2 is company
            role = part1.trim().replace(datePattern, '').replace(datePattern2, '').trim().replace(/\s*,\s*$/, '');
            company = part2.trim().replace(datePattern, '').replace(datePattern2, '').trim();
          } else {
            // part1 is company, part2 is role
            company = part1.trim().replace(datePattern, '').replace(datePattern2, '').trim();
            role = part2.trim().replace(datePattern, '').replace(datePattern2, '').trim().replace(/\s*,\s*$/, '');
          }
          
          // Remove duplicate company names
          if (company === role || (part1 === part2 && part1)) {
            // If company and role are the same, or part1 equals part2, likely duplicate
            // Try to extract role from the end
            const roleMatch = role.match(/(.+?)\s+(Software Engineer|Project Trainee|Intern|Developer|Engineer|Manager|Analyst|Consultant|Specialist|Lead|Senior|Junior|Associate|Trainee)/i);
            if (roleMatch) {
              company = roleMatch[1].trim();
              role = roleMatch[2].trim();
            } else if (part1 === part2) {
              // If both parts are identical, use first as company, second as role (if it has role keywords)
              company = part1.trim();
              role = part3?.trim() || '';
            }
          }
          
          currentExperience = {
            role: role,
            company: company,
            dates: dates,
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
        } else if (currentExperience && line.match(/^[•\-\*]/)) {
          currentExperience.bullets.push(line.replace(/^[•\-\*\d.]+\s*/, ''));
        } else if (currentExperience && !line.match(/^[A-Z]/) && line.length > 10) {
          // Sometimes bullets don't have bullet points
          currentExperience.bullets.push(line.trim());
        }
        break;

      case 'education':
        if (line.match(/^[A-Z]/) && line.length < 200) {
          // Check if this line contains multiple education entries (separated by | or on same line)
          // Example: "Northeastern University | M.S., Computer Software Engineering (GPA: 3.8) REVA University | B.Tech..."
          const pipeSplit = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
          
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
            
            for (let i = 0; i < pipeSplit.length; i++) {
              const part = pipeSplit[i];
              
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
                      gpa: currentGPA || undefined,
                      gradDate: currentDate || undefined,
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
                  gpa: currentGPA || undefined,
                  gradDate: currentDate || undefined,
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

  return resume;
}

