# ng-gen

*This project is soon-to-be renamed.*

To what I don't know.

A project of the same name [already exists](https://github.com/nvbn/ng-gen) on github.

This project is a minimalistic cli for ng2 typescript development.

ng-gen generates the following objects:
- components
- inline-components (webpack moduleId work around)
- modules
- services
- and barrels

all objects generated are automatically imported, declared, or provided in their nearest ancestor module.

syntax:

## Install it globally:

```bash
npm i -g ng-gen
```

## Work Flow


### Think about app structure in advance

*The cli assumes there will be a package.json file in the current working directory or in a parent directory.*

It doesn't care if your project was created manually or with another cli.

Say you want an app with the following structure:

![alt text](https://github.com/gforceg/ng-gen/raw/master/readme/readme.app.struct.png "app structure")

### Build your modules

![alt text](https://github.com/gforceg/ng-gen/raw/master/readme/readme.app.modules.png "app modules")

![alt text](https://github.com/gforceg/ng-gen/raw/master/readme/build.modules.gif "building app modules")

### Create the guts of your modules

Objects are automatically added to the first module in the current directory or nearest parent directory. This allows you to quickly go from a sketch to a skeleton.

![alt text](https://github.com/gforceg/ng-gen/raw/master/readme/readme.app.guts.png "app guts")

![alt text](https://github.com/gforceg/ng-gen/raw/master/readme/build.guts.gif "building app modules")
