/**
 * @file
 * @desc formate package.json / package-lock.json
 * @author liuyuanyangscript@gmail.com https://github.com/hoperyy
 * @date  2018/10/19
 */

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const cwd = process.cwd();

const packageJsonFile = path.join(cwd, 'package.json');
const packageLockJsonFile = path.join(cwd, 'package-lock.json');

const dotPackageJsonFile = path.join(cwd, '.package.json');
const dotPackageLockJsonFile = path.join(cwd, '.package-lock.json');

if (!fs.existsSync(packageJsonFile)) {
    throw Error('missing package.json');
}

if (!fs.existsSync(packageLockJsonFile)) {
    throw Error('missing package-lock.json');
}

const formatePackageJson = () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));

    const newPackageJson = {};
    const optionalDependencies = {};

    for (let key in packageJson) {
        if (/dependen/i.test(key)) {
            for (let dep in packageJson[key]) {
                optionalDependencies[dep] = packageJson[key][dep];
            }
        } else {
            newPackageJson[key] = packageJson[key];
        }
    }

    newPackageJson['optionalDependencies'] = optionalDependencies;

    return JSON.stringify(newPackageJson, null, 4);
};

const createDotFile = (newPackageJsonContent) => {
    fse.ensureFileSync(dotPackageJsonFile);
    fse.ensureFileSync(dotPackageLockJsonFile);

    fs.writeFileSync(dotPackageJsonFile, newPackageJsonContent);
    fse.copyFileSync(packageLockJsonFile, dotPackageLockJsonFile);
};

const newPackageJsonContent = formatePackageJson();

createDotFile(newPackageJsonContent);

console.log('formate done!');
