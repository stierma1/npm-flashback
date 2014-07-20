npm-flashback
=============

Flashback will do npm install as if it were taking place on a given date.  All semantically versioned dependencies will be installed as if it were taking place on that date.  Ie newer packages will be ignored.

I have found that semantic versioning in npm can cause issues when patches and minors break functionality.  Use this tool to help diagnose issues.

#Quick start

##Node.js

    npm install -g flashback

##Usage
Navigate to root of module you want flashbacked

    flashback <date>

##Errors Will Corrupt Node_Modules
  Reinstall dependencies through npm install to fix corruption

## How It works
1. Read the package.json dependencies
2. Run npm view on each dependency
3. Filter by date and available versions
4. Install specific version
5. Recurse on the newly installed modules dependencies
