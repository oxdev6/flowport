import chalk from 'chalk';
import path from 'path';
import { analyzeProjectWithSlither } from '../../lib/optimizer/slitherProject.js';

export async function optimizeProject(projectDir, options = {}) {
  const dir = path.resolve(projectDir || process.cwd());
  if (options.slither === true) process.env.SLITHER_ENABLED = '1';
  if (options.slither === false) process.env.SLITHER_ENABLED = '0';

  console.log(chalk.blue.bold('\n🔧 Project Optimizer (Slither)\n'));
  console.log(chalk.gray(`Analyzing project: ${dir}`));

  const suggestions = analyzeProjectWithSlither(dir);
  display(suggestions);

  if (options.output) {
    console.log(JSON.stringify({ ok: true, suggestions }, null, 2));
  }

  return suggestions;
}

function display(suggestions) {
  console.log(chalk.green.bold('\n✅ Project Analysis Complete!\n'));
  const total = suggestions.length;
  const high = suggestions.filter((s) => s.priority === 'high').length;
  const medium = suggestions.filter((s) => s.priority === 'medium').length;
  const low = suggestions.filter((s) => s.priority === 'low').length;

  if (total === 0) {
    console.log(chalk.yellow('No findings from Slither at project level.'));
  } else {
    console.log(chalk.blue.bold('📋 Findings:'));
    for (const s of suggestions) {
      console.log(`  ${chalk.bold(s.title)} ${badge(s.priority)}`);
      console.log(chalk.gray(`    ${s.description}`));
      console.log();
    }
  }

  console.log(chalk.blue.bold('📊 Summary:'));
  console.log(`Total: ${total}  High: ${high}  Medium: ${medium}  Low: ${low}`);
}

function badge(p) {
  if (p === 'high') return chalk.red('(high)');
  if (p === 'medium') return chalk.yellow('(medium)');
  return chalk.green('(low)');
}
