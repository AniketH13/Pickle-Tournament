import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'admin-config.json');

interface AdminConfig {
  password: string;
}

const DEFAULT_CONFIG: AdminConfig = { password: 'picklegonepal' };

export function getAdminConfig(): AdminConfig {
  if (process.env.ADMIN_PASSWORD) {
    return { password: process.env.ADMIN_PASSWORD };
  }
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content) as AdminConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setAdminConfig(config: AdminConfig): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist admin-config.json (expected in read-only serverless environments like Vercel):', err);
  }
}
