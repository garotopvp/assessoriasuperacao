import { execSync } from 'child_process';
import fs from 'fs';
const log = execSync('git log -n 50 --format="%H|%cd|%s"', { encoding: 'utf-8' });
fs.writeFileSync('gitlog.txt', log, 'utf8');
