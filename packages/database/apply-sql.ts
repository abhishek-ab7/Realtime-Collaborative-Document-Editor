import { prisma } from './src';
import * as fs from 'fs';
import * as path from 'path';

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (char === '$' && nextChar === '$') {
      inDollarQuote = !inDollarQuote;
      current += '$$';
      i++; // Skip the second '$'
      continue;
    }

    if (char === ';' && !inDollarQuote) {
      statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

async function main() {
  const sqlPath = path.join(__dirname, 'enable_rls.sql');
  console.log(`Reading SQL script from: ${sqlPath}`);
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Remove single line SQL comments (starting with --)
  const cleanSql = sqlContent
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

  const sqlCommands = splitSqlStatements(cleanSql)
    .map((cmd) => cmd.trim())
    .filter((cmd) => cmd.length > 0);

  console.log(`Executing ${sqlCommands.length} SQL statement(s)...`);
  try {
    for (const [index, command] of sqlCommands.entries()) {
      console.log(
        `\nExecuting statement [${index + 1}/${sqlCommands.length}]:\n${command.substring(0, 80)}...`,
      );
      await prisma.$executeRawUnsafe(command);
    }
    console.log('\n✅ All SQL statements executed successfully!');
  } catch (error) {
    console.error('❌ Failed to execute SQL statement:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
