const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const chalk = require('chalk');

function main() {
  const schemaPath = path.join(process.cwd(), 'migration', 'config.schema.json');
  const configPath = process.env.FLOWPORT_CONFIG || path.join(process.cwd(), 'migration', 'config.example.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  const validate = ajv.compile(schema);
  const valid = validate(config);
  if (valid) {
    console.log(chalk.green('Config is valid: ' + configPath));
    process.exit(0);
  } else {
    console.log(chalk.red('Config validation failed: ' + configPath));
    for (const err of validate.errors || []) {
      console.log('-', err.instancePath || '/', err.message);
    }
    process.exit(1);
  }
}

main();


