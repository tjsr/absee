#! node

import { spawn } from 'child_process';

if (process.env['ABSEE_GITHUB_PAT'] === undefined) {
  console.error('ABSEE_GITHUB_PAT is not set');
  process.exit(1);
}

const appArg = 2;

if (process.argv.length <= appArg || process.argv[appArg] === undefined) {
  console.error('tag is not set');
  process.exit(1);
}

if (process.argv.length <= appArg + 1 || process.argv[appArg + 1] === undefined) {
  console.error('dockerfile is not set');
  process.exit(1);
}

const tag = process.argv[appArg];
const dockerfile = process.argv[appArg + 1];
console.log(`Running docker build on ${dockerfile} => ${tag}... `);

const child = spawn('docker', [
  'build',
  '-t',
  tag,
  '--secret',
  'id=github,env=ABSEE_GITHUB_PAT',
  '--cache-from',
  'tjsr/absee:latest',
  '--file',
  dockerfile,
  '.',
]);

child.stdout.on('data', (data) => process.stdout.write(data.toString()));
child.stderr.on('data', (data) => process.stderr.write(data.toString()));

child.on('close', (code: number | null) => {
  if (code !== 0) {
    console.error(`docker process exited with code ${code}`);
    process.exit(code || 0);
  } else {
    console.log('docker process exited successfully');
  }
});
