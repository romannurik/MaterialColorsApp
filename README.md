# Material Colors for Mac

A handy little Mac app that gives you quick access to the standard material design color palette.

<img src="art/screenshot.png" width="320" alt="Screenshot">

**[Download the app](https://github.com/romannurik/MaterialColorsApp/releases/latest)**

## Build instructions

If you want to customize the app for your own needs, you can do a custom build.

  1. First install [Node.js](https://nodejs.org/) and [yarn](https://yarnpkg.com/).
  2. Clone the repository and in the root directory, run:
     ```
     $ yarn install
     ```
  3. To run the app:
     ```
     $ yarn start
     ```

Note that you'll probably want to disable the auto-updating mechanism by emptying out the `checkForUpdates` method in
[main.js](https://github.com/romannurik/MaterialColorsApp/blob/master/src/main/main.js).
