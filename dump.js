import { execSync } from 'child_process';
import fs from 'fs';
const log = execSync('git log --oneline -n 15', { encoding: 'utf-8' });
fs.writeFileSync('log.txt', log, 'utf8');
