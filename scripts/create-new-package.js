const fs = require('fs');
const path = require('path');

const childprocess = require('child_process');


const pkg = require('../package.json');
const pkg_name = pkg.name;
const pkg_scope = pkg_name.split('/')[0];

(async () => {
  const { createPromptModule } = await import('inquirer');
  const prompt = createPromptModule();
  const data = await prompt([
    {
      type: 'input',
      name: 'project',
      message: '请输入模块名称'
    }
  ])
  const dir = createProjectDir(data.project);
  createTypeScriptConfigFile(dir);
  createPackageFile(dir, data.project, data.bin);
  createReadme(dir, data.project);
  const src = createDir(dir, 'src');
  createIndexFile(src, data.project);
  childprocess.spawn('lerna', ['bootstrap'], {
    stdio: 'inherit'
  });
})();

function createProjectDir(name) {
  const dir = path.resolve(process.cwd(), 'packages', name);
  fs.mkdirSync(dir);
  return dir;
}

function createTypeScriptConfigFile(dir) {
  const template = {
    "extends": "../../tsconfig.json",
    "extendsExact": true,
    "compilerOptions": {
      "declaration": true,
      "outDir": "dist",
      "module": "node16",
      "moduleResolution": "node16",
      "moduleDetection": "force",
    },
    "include": ["src"]
  }
  fs.writeFileSync(path.resolve(dir, 'tsconfig.json'), JSON.stringify(template, null, 2), 'utf8');
}

function createPackageFile(dir, project, bin) {
  const template = {
    "name": pkg_scope + "/" + project,
    "version": "1.0.0",
    "description": "some description",
    "license": "MIT",
    "main": "dist/index.js",
    "keywords": [],
    "directories": {
      "lib": "src"
    },
    "files": [
      "dist"
    ],
    "scripts": {
      "build": "rm -rf ./dist && tsc",
    },
    "publishConfig": {
      "access": "public"
    }
  }
  fs.writeFileSync(path.resolve(dir, 'package.json'), JSON.stringify(template, null, 2), 'utf8');
}

function createReadme(dir, project) {
  const template = `# \`${pkg_scope}/${project}\`

> TODO: description

## Usage

\`\`\`
const container = require('@pjblog/${project}');

// TODO: DEMONSTRATE API
\`\`\``;
  fs.writeFileSync(path.resolve(dir, 'README.md'), template, 'utf8');
}

function createDir(dir, name) {
  const _dir = path.resolve(dir, name);
  fs.mkdirSync(_dir);
  return _dir;
}

function createIndexFile(src, project) {
  fs.writeFileSync(path.resolve(src, 'index.ts'), `export const abc = 1;`, 'utf8');
}