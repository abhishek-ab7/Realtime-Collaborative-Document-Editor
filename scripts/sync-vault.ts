/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to count TS errors in a directory
function countTsErrors(dir: string): number {
  const tsconfigPath = path.join(ROOT_DIR, dir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return 0;

  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(ROOT_DIR, dir),
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return 0;
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const allOutput = stdout + stderr;
    const lines = allOutput.split('\n').filter((l: string) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith('Found') && !trimmed.startsWith('Errors');
    });
    return lines.length;
  }
}

// Helper to parse JUnit reports
function parseJunitReport(filePath: string): { tests: number; failures: number } {
  if (!fs.existsSync(filePath)) {
    return { tests: 0, failures: 0 };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const testsuitesMatch = content.match(/<testsuites[^>]+tests="(\d+)"[^>]+failures="(\d+)"/);
  if (testsuitesMatch) {
    return {
      tests: parseInt(testsuitesMatch[1], 10),
      failures: parseInt(testsuitesMatch[2], 10),
    };
  }

  let totalTests = 0;
  let totalFailures = 0;
  const suiteRegex = /<testsuite[^>]+tests="(\d+)"[^>]+failures="(\d+)"/g;
  let match;
  while ((match = suiteRegex.exec(content)) !== null) {
    totalTests += parseInt(match[1], 10);
    totalFailures += parseInt(match[2], 10);
  }

  return { tests: totalTests, failures: totalFailures };
}

// Helper to find the active phase
function readCurrentPhase(): { id: string; name: string } {
  const indexPath = path.join(ROOT_DIR, 'docs/02-phases/phase-00-INDEX.md');
  if (!fs.existsSync(indexPath)) {
    return { id: '09', name: 'Phase 09: Sharing & Permissions (Days 34–39)' };
  }
  const content = fs.readFileSync(indexPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^-\s*\[\s*\]\s*\[\[02-phases\/(phase-\d+-[^|]+)\|([^\]]+)\]\]/);
    if (match) {
      const phaseFile = match[1];
      const phaseName = match[2].trim();
      const phaseId = phaseFile.match(/phase-(\d+)/)?.[1] || '09';
      return { id: phaseId, name: phaseName };
    }
  }
  return { id: '09', name: 'Phase 09: Sharing & Permissions (Days 34–39)' };
}

// Helper to get coverage summary percentage
function getCoverage(): string {
  const coveragePaths = [
    'apps/web/coverage/coverage-summary.json',
    'apps/socket-server/coverage/coverage-summary.json',
    'packages/shared/coverage/coverage-summary.json',
  ];
  let totalPct = 0;
  let count = 0;
  for (const p of coveragePaths) {
    const fullPath = path.join(ROOT_DIR, p);
    if (fs.existsSync(fullPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const pct = json.total?.lines?.pct;
        if (typeof pct === 'number') {
          totalPct += pct;
          count++;
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }
  if (count > 0) {
    return `${(totalPct / count).toFixed(1)}%`;
  }
  return 'XX%';
}

// Helper to extract sections from current-day.md
function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?:\\n##|$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : 'None.';
}

function syncVault() {
  const now = new Date();
  const timestamp = now.toLocaleString();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
  const dateStr = now.toISOString().split('T')[0];

  console.log(`[Sync Vault] Starting vault sync at ${timestamp}...`);

  // 1. Read test results
  const reportPaths = [
    path.join(ROOT_DIR, 'apps/web/test-report.junit.xml'),
    path.join(ROOT_DIR, 'apps/socket-server/test-report.junit.xml'),
    path.join(ROOT_DIR, 'packages/shared/test-report.junit.xml'),
  ];
  let totalTests = 0;
  let totalFailures = 0;
  for (const p of reportPaths) {
    const report = parseJunitReport(p);
    totalTests += report.tests;
    totalFailures += report.failures;
  }
  const testsPassing = totalTests - totalFailures;

  // 2. Get git log
  let gitCommits = '';
  try {
    gitCommits = execSync('git log --oneline -5', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.warn(err);
    gitCommits = 'No recent commits found.';
  }

  // 3. Count TypeScript errors
  const tsDirs = [
    'apps/web',
    'apps/socket-server',
    'packages/shared',
    'packages/yjs-utils',
    'packages/database',
  ];
  let totalTsErrors = 0;
  for (const dir of tsDirs) {
    totalTsErrors += countTsErrors(dir);
  }

  // 4. Read active phase
  const activePhase = readCurrentPhase();

  // 5. Read current daily log Focus & Blockers
  const dailyLogPath = path.join(ROOT_DIR, 'docs/03-daily-logs/current-day.md');
  let focus = 'None.';
  let blockers = 'None.';
  if (fs.existsSync(dailyLogPath)) {
    const dailyContent = fs.readFileSync(dailyLogPath, 'utf8');
    focus = extractSection(dailyContent, "Today's Focus");
    blockers = extractSection(dailyContent, 'Blockers');
  }

  // Generate docs/PROJECT-STATUS.md
  const projectStatusContent = `# Collabdoc — Live Project Status
> Auto-generated by scripts/sync-vault.ts at ${timestamp}

## Current Phase
${activePhase.name}

## Build Health
- TypeScript Errors: ${totalTsErrors}
- Tests Passing: ${testsPassing}/${totalTests}
- Last Build: ${timestamp}
- Coverage: ${getCoverage()}

## Recent Commits (last 5)
\`\`\`text
${gitCommits}
\`\`\`

## Today's Focus
${focus}

## Blockers
${blockers}
`;

  const statusPath = path.join(ROOT_DIR, 'docs/PROJECT-STATUS.md');
  fs.writeFileSync(statusPath, projectStatusContent, 'utf8');
  console.log(`[Sync Vault] Wrote project status to ${statusPath}`);

  // Append timestamped log to docs/03-daily-logs/day-[date]-progress.md
  const progressLogPath = path.join(ROOT_DIR, `docs/03-daily-logs/day-${dateStr}-progress.md`);
  let progressContent = '';
  if (fs.existsSync(progressLogPath)) {
    progressContent = fs.readFileSync(progressLogPath, 'utf8');
  } else {
    progressContent = `# Progress Log — ${dateStr}\n\n`;
  }

  progressContent += `### [${timeStr}] Auto-check
- Tests: ${testsPassing}/${totalTests} passing
- TS errors: ${totalTsErrors}
`;

  fs.writeFileSync(progressLogPath, progressContent, 'utf8');
  console.log(`[Sync Vault] Appended progress log entry to ${progressLogPath}`);
}

syncVault();
