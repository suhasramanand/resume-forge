import { ParsedResume } from './resumeParser';

export interface FormattedLine {
  id: string;
  type: 'header' | 'section' | 'content' | 'bullet' | 'separator';
  content: string;
  metadata?: {
    section?: string;
    projectIndex?: number;
    experienceIndex?: number;
    educationIndex?: number;
    bulletIndex?: number;
    field?: string;
    align?: 'left' | 'right' | 'center';
    courseworkIndex?: number;
    hasDates?: boolean;
    dates?: string;
    skillIndex?: number;
  };
}

export interface FormattedResume {
  lines: FormattedLine[];
}

const MAX_LINES_PER_PAGE = 60; // Approximate lines for one page at 11pt font

export function formatResume(parsed: ParsedResume): FormattedResume {
  const lines: FormattedLine[] = [];
  let lineId = 0;

  const addLine = (type: FormattedLine['type'], content: string, metadata?: FormattedLine['metadata']) => {
    lines.push({
      id: `line-${lineId++}`,
      type,
      content,
      metadata,
    });
  };

  const addSeparator = () => {
    addLine('separator', '---');
  };

  // HEADER
  if (parsed.name) {
    addLine('header', parsed.name);
  }

  // All contact info on one line
  const contactParts: string[] = [];
  if (parsed.location) contactParts.push(parsed.location);
  if (parsed.phone) contactParts.push(parsed.phone);
  if (parsed.email) contactParts.push(parsed.email);
  
  // LinkedIn and GitHub on the same line
  if (parsed.linkedin) {
    const linkedinUrl = parsed.linkedin.startsWith('http') ? parsed.linkedin : `https://${parsed.linkedin}`;
    contactParts.push(`LINKEDIN|${linkedinUrl}`);
  }
  if (parsed.github) {
    const githubUrl = parsed.github.startsWith('http') ? parsed.github : `https://${parsed.github}`;
    contactParts.push(`GITHUB|${githubUrl}`);
  }
  
  if (contactParts.length > 0) {
    addLine('content', contactParts.join(' | '));
  }

  addSeparator();

  // EDUCATION (moved to top after header, matching example format)
  if (parsed.education && parsed.education.length > 0) {
    addLine('section', 'EDUCATION', { section: 'education' });
    
    // Deduplicate education entries
    const uniqueEducation = parsed.education.filter((edu, idx, self) => 
      idx === self.findIndex(e => 
        e.institution === edu.institution && 
        e.degree === edu.degree && 
        e.gradDate === edu.gradDate
      )
    );
    
    uniqueEducation.slice(0, 2).forEach((edu, eduIdx) => {
      // University name (separate box)
      if (edu.institution) {
        addLine('content', edu.institution, { 
          section: 'education', 
          educationIndex: eduIdx, 
          field: 'institution' 
        });
      }
      // Degree/Course (separate box)
      if (edu.degree) {
        addLine('content', edu.degree, { 
          section: 'education', 
          educationIndex: eduIdx, 
          field: 'degree' 
        });
      }
      // GPA (separate box)
      if (edu.gpa) {
        addLine('content', `GPA: ${edu.gpa}`, { 
          section: 'education', 
          educationIndex: eduIdx, 
          field: 'gpa' 
        });
      }
      // Dates (right-aligned, separate box)
      if (edu.gradDate) {
        addLine('content', edu.gradDate, { 
          section: 'education', 
          educationIndex: eduIdx, 
          field: 'dates',
          align: 'right'
        });
      }
      // Coursework (each item as separate box)
      if (edu.coursework && edu.coursework.length > 0) {
        edu.coursework.forEach((course, courseIdx) => {
          addLine('content', course, { 
            section: 'education', 
            educationIndex: eduIdx, 
            field: 'coursework', 
            courseworkIndex: courseIdx 
          });
        });
      }
    });
    addSeparator();
  }

  // SKILLS (TECHNICAL SKILLS)
  if (parsed.skills && parsed.skills.length > 0) {
    addLine('section', 'TECHNICAL SKILLS', { section: 'skills' });
    const categorizedSkills = categorizeSkills(parsed.skills);
    
    // Reorganize into the requested format
    const skillGroups: Record<string, string[]> = {
      'Programming': [],
      'Cloud & DevOps': [],
      'AI & LLMs': [],
      'Data & Integration': [],
      'Frontend': [],
    };
    
    // Map categorized skills to new groups
    if (categorizedSkills['Languages']) {
      categorizedSkills['Languages'].forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        if (lowerSkill.includes('sql')) {
          skillGroups['Programming'].push(skill);
        } else {
          skillGroups['Programming'].push(skill);
        }
      });
    }
    if (categorizedSkills['Cloud']) {
      skillGroups['Cloud & DevOps'].push(...categorizedSkills['Cloud']);
    }
    if (categorizedSkills['DevOps']) {
      skillGroups['Cloud & DevOps'].push(...categorizedSkills['DevOps']);
    }
    if (categorizedSkills['Infrastructure']) {
      skillGroups['Cloud & DevOps'].push(...categorizedSkills['Infrastructure']);
    }
    if (categorizedSkills['Databases']) {
      // Only add non-SQL databases to Data & Integration, SQL goes to Programming
      categorizedSkills['Databases'].forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        if (lowerSkill.includes('sql') && !lowerSkill.includes('postgres') && !lowerSkill.includes('mysql')) {
          if (!skillGroups['Programming'].includes(skill)) {
            skillGroups['Programming'].push(skill);
          }
        } else {
          skillGroups['Data & Integration'].push(skill);
        }
      });
    }
    if (categorizedSkills['Frameworks']) {
      skillGroups['Frontend'].push(...categorizedSkills['Frameworks']);
    }
    // Also check all skills for AI/LLM, Data, Frontend patterns
    const allSkills = parsed.skills || [];
    allSkills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      // AI & LLMs
      if ((lowerSkill.includes('ai') || lowerSkill.includes('llm') || lowerSkill.includes('langchain') || lowerSkill.includes('pytorch') || lowerSkill.includes('prompt') || lowerSkill.includes('rag') || lowerSkill.includes('agent')) && !skillGroups['AI & LLMs'].includes(skill)) {
        skillGroups['AI & LLMs'].push(skill);
      }
      // Data & Integration
      else if ((lowerSkill.includes('postgres') || lowerSkill.includes('mongo') || lowerSkill.includes('kafka') || lowerSkill.includes('fastapi') || (lowerSkill.includes('rest') && lowerSkill.includes('api')) || lowerSkill.includes('data modeling')) && !skillGroups['Data & Integration'].includes(skill)) {
        skillGroups['Data & Integration'].push(skill);
      }
      // Frontend
      else if ((lowerSkill.includes('react') || lowerSkill.includes('next') || lowerSkill.includes('tailwind') || lowerSkill.includes('frontend') || lowerSkill.includes('ui engineering') || lowerSkill.includes('web security')) && !skillGroups['Frontend'].includes(skill)) {
        skillGroups['Frontend'].push(skill);
      }
    });
    
    if (categorizedSkills['Other']) {
      // Distribute other skills appropriately
      categorizedSkills['Other'].forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        if (lowerSkill.includes('ai') || lowerSkill.includes('llm') || lowerSkill.includes('langchain') || lowerSkill.includes('pytorch') || lowerSkill.includes('prompt') || lowerSkill.includes('rag') || lowerSkill.includes('agent')) {
          if (!skillGroups['AI & LLMs'].includes(skill)) {
            skillGroups['AI & LLMs'].push(skill);
          }
        } else if (lowerSkill.includes('postgres') || lowerSkill.includes('mongo') || lowerSkill.includes('kafka') || lowerSkill.includes('fastapi') || (lowerSkill.includes('rest') && lowerSkill.includes('api')) || lowerSkill.includes('data modeling')) {
          if (!skillGroups['Data & Integration'].includes(skill)) {
            skillGroups['Data & Integration'].push(skill);
          }
        } else if (lowerSkill.includes('react') || lowerSkill.includes('next') || lowerSkill.includes('tailwind') || lowerSkill.includes('frontend') || lowerSkill.includes('ui engineering') || lowerSkill.includes('web security')) {
          if (!skillGroups['Frontend'].includes(skill)) {
            skillGroups['Frontend'].push(skill);
          }
        } else if (lowerSkill.includes('python') || lowerSkill.includes('java') || lowerSkill.includes('javascript') || lowerSkill.includes('typescript') || lowerSkill.includes('c++')) {
          if (!skillGroups['Programming'].includes(skill)) {
            skillGroups['Programming'].push(skill);
          }
        } else if (lowerSkill.includes('aws') || lowerSkill.includes('gcp') || lowerSkill.includes('azure') || lowerSkill.includes('docker') || lowerSkill.includes('kubernetes') || lowerSkill.includes('terraform') || lowerSkill.includes('ci/cd') || lowerSkill.includes('iam')) {
          if (!skillGroups['Cloud & DevOps'].includes(skill)) {
            skillGroups['Cloud & DevOps'].push(skill);
          }
        }
      });
    }
    
    // Add skills - category title as separate box, then each skill as separate box
    Object.entries(skillGroups).forEach(([category, skills]) => {
      if (skills.length > 0) {
        // Remove duplicates from skills array
        const uniqueSkills = Array.from(new Set(skills));
        // Remove category name from skills if it appears (to avoid "Programming: Programming: ...")
        const cleanedSkills = uniqueSkills.filter(skill => 
          !skill.toLowerCase().includes(category.toLowerCase() + ':')
        );
        if (cleanedSkills.length > 0) {
          // Category title as separate box
          addLine('content', category, { section: 'skills', field: 'category' });
          
          // Each skill as separate box
          cleanedSkills.forEach((skill, skillIdx) => {
            // Split by comma if skill contains multiple items
            const skillItems = skill.split(',').map(s => s.trim()).filter(s => s.length > 0);
            skillItems.forEach((skillItem, itemIdx) => {
              addLine('content', skillItem, { 
                section: 'skills', 
                field: 'skill',
                skillIndex: skillIdx * 100 + itemIdx // Unique index for each skill item
              });
            });
          });
        }
      }
    });
    
    addSeparator();
  }

  // EXPERIENCE (WORK EXPERIENCE) - before projects to match example
  if (parsed.experience && parsed.experience.length > 0) {
    addLine('section', 'WORK EXPERIENCE', { section: 'experience' });
    
    parsed.experience.slice(0, 4).forEach((exp, idx) => {
      // Company (separate box)
      if (exp.company) {
        addLine('content', exp.company, {
          section: 'experience',
          experienceIndex: idx,
          field: 'company',
        });
      }
      // Role (separate box)
      if (exp.role) {
        addLine('content', exp.role, {
          section: 'experience',
          experienceIndex: idx,
          field: 'role',
        });
      }
      // Location (separate box, if exists)
      if (exp.location) {
        addLine('content', exp.location, {
          section: 'experience',
          experienceIndex: idx,
          field: 'location',
        });
      }
      // Dates (right-aligned, separate box) - moved before bullets
      if (exp.dates) {
        addLine('content', exp.dates, {
          section: 'experience',
          experienceIndex: idx,
          field: 'dates',
          align: 'right',
        });
      }
      // Bullets (each as separate box)
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets
          .map(b => compressBullet(b))
          .slice(0, 4)
          .forEach((bullet, bulletIdx) => {
            addLine('bullet', bullet, {
              section: 'experience',
              experienceIndex: idx,
              field: 'bullet',
              bulletIndex: bulletIdx,
            });
          });
      }
    });
    addSeparator();
  }

  // PROJECTS
  if (parsed.projects && parsed.projects.length > 0) {
    addLine('section', 'PROJECTS', { section: 'projects' });
    
    parsed.projects.slice(0, 5).forEach((project, idx) => {
      // Project name/title (separate box)
      if (project.name) {
        addLine('content', project.name, {
          section: 'projects',
          projectIndex: idx,
          field: 'name',
        });
      }
      // Tech stack (separate box)
      if (project.techStack) {
        addLine('content', project.techStack, {
          section: 'projects',
          projectIndex: idx,
          field: 'techStack',
        });
      }
      // Location (separate box, if exists)
      if (project.location) {
        addLine('content', project.location, {
          section: 'projects',
          projectIndex: idx,
          field: 'location',
        });
      }
      // Dates (right-aligned, separate box) - moved before bullets
      if (project.dates) {
        addLine('content', project.dates, {
          section: 'projects',
          projectIndex: idx,
          field: 'dates',
          align: 'right',
        });
      }
      // Description bullets (each as separate box)
      if (project.description && project.description.length > 0) {
        project.description.forEach((desc, descIdx) => {
          const compressedDesc = compressBullet(desc);
          addLine('bullet', compressedDesc, {
            section: 'projects',
            projectIndex: idx,
            field: 'bullet',
            bulletIndex: descIdx,
          });
        });
      }
    });
    addSeparator();
  }

  // CERTIFICATIONS
  if (parsed.certifications && parsed.certifications.length > 0) {
    addLine('section', 'CERTIFICATIONS', { section: 'certifications' });
    parsed.certifications.slice(0, 5).forEach(cert => {
      addLine('content', `• ${cert}`, { section: 'certifications' });
    });
  }

  // Compress if needed
  if (lines.length > MAX_LINES_PER_PAGE) {
    return compressResume({ lines });
  }

  return { lines };
}

function compressResume(resume: FormattedResume): FormattedResume {
  const compressed = { ...resume };
  
  // Remove less critical sections first
  const sectionPriority = ['header', 'experience', 'skills', 'projects', 'education', 'summary', 'certifications'];
  
  // Compress bullets
  compressed.lines = compressed.lines.map(line => {
    if (line.type === 'bullet') {
      return {
        ...line,
        content: compressBullet(line.content.replace(/^•\s*/, '')),
      };
    }
    return line;
  });

  // If still too long, remove lowest priority sections
  if (compressed.lines.length > MAX_LINES_PER_PAGE) {
    const linesToKeep: FormattedLine[] = [];
    let inLowPrioritySection = false;
    
    for (const line of compressed.lines) {
      if (line.type === 'section') {
        const sectionName = line.content.toLowerCase();
        inLowPrioritySection = sectionName === 'certifications' || sectionName === 'summary';
      }
      
      if (!inLowPrioritySection || linesToKeep.length < MAX_LINES_PER_PAGE - 10) {
        linesToKeep.push(line);
      }
    }
    
    compressed.lines = linesToKeep;
  }

  return compressed;
}

function compressBullet(text: string): string {
  // Remove redundant words, compress phrases
  let compressed = text
    .replace(/\s+/g, ' ')
    .replace(/\b(utilized|leveraged|used)\b/gi, 'used')
    .replace(/\b(responsible for|responsible|duties included)\b/gi, '')
    .replace(/\b(in order to|so as to)\b/gi, 'to')
    .replace(/\b(a lot of|numerous|many)\b/gi, 'multiple')
    .replace(/\b(approximately|around|about)\s+(\d+)\b/gi, '$2')
    .trim();

  // Don't truncate - let it wrap naturally
  return compressed;
}

function compressText(text: string, minLines: number, maxLines: number): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const compressed = sentences.slice(0, maxLines).join('. ').trim();
  return compressed;
}

function categorizeSkills(skills: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    'Languages': [],
    'Cloud': [],
    'DevOps': [],
    'Infrastructure': [],
    'Databases': [],
    'Tools': [],
    'Frameworks': [],
    'Other': [],
  };

  const skillPatterns: Record<string, RegExp[]> = {
    'Languages': [/python|java|javascript|typescript|go|rust|c\+\+|c#|ruby|php|swift|kotlin|scala|r|matlab|sql/i],
    'Cloud': [/aws|azure|gcp|google cloud|kubernetes|docker|terraform|cloudformation/i],
    'DevOps': [/jenkins|ci\/cd|gitlab|github actions|ansible|puppet|chef|prometheus|grafana|iam/i],
    'Infrastructure': [/kubernetes|docker|terraform|ansible|linux|unix|networking|load balancing/i],
    'Databases': [/mysql|postgresql|mongodb|cassandra|redis|elasticsearch|dynamodb|sql server|oracle/i],
    'Frameworks': [/react|angular|vue|django|flask|spring|express|next\.js|node\.js|tailwind/i],
    'Tools': [/git|jira|confluence|slack|vscode|intellij|eclipse/i],
  };

  skills.forEach(skill => {
    let categorized = false;
    for (const [category, patterns] of Object.entries(skillPatterns)) {
      if (patterns.some(pattern => pattern.test(skill))) {
        categories[category].push(skill);
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      categories['Other'].push(skill);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

