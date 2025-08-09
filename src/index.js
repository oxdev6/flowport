#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

const program = new Command();

program
  .name('flowport')
  .description('FlowPort CLI – foundation for migrations and visualization')
  .version(pkg.version, '-v, --version', 'output the current version');

program
  .command('migrate')
  .description('Run migrations (placeholder)')
  .action(() => {
    console.log('Migration command placeholder - coming soon!');
  });

program
  .command('visualize')
  .description('Visualize data flows (placeholder)')
  .action(() => {
    console.log('Visualization command placeholder - coming soon!');
  });

program.parse(process.argv);


