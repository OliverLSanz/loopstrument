**Linnstrument Bitwig script for Live Looping**

# [Watch the demo on YouTube](https://www.youtube.com/watch?v=S8n6QqYITR4)

# Loopstrument

This is a controller script for Bitwig. It allows you access some features of Bitwig directly from your Linnstrument, allowing you to live loop without much or any direct interaction with your computer or any other input device.

## How to Use

> **IMPORTANT** - When you connect your Linnstrument, the script will automatically overwrite it's configuration (row offset, channels, etc). This is needed for the controller to work.

### Instalation

The script is defined as a single Javascript (.js) file.

Please refer to the [Bitwig documentation](https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/) on how to install a controller script.

The file you need to install is [here](LinnstrumentLooping.control.js).

### Usage

[Link to demo video](https://youtu.be/S8n6QqYITR4)

## Development

> Disclaimers:
>
> - This project has been developed as a quick and dirty side project for personal usage. Shortcuts have been taken.
>
> - If you want to modify or extend the controller, I encourage you to do so and will be there to support you. Also, the code is designed to be easily extendable.
>
> - BUT probably won't be obious how to do so, as documentation is scarce. You will need to learn by example.
>

### Setup

First, clone the repository. I advise to directly clone it in the directory where Bitwig looks for controller scripts. This way you can develop and test your changes in real time, as the script will be reloaded by Bitwig each time it changes.

### File structure

Don't directly modify the `LinnstrumentLooping.control.js` file. Instead, the project is set up as a Typescript project.

> Using namespaces is the best way I found to be able to split the code into different files and get typescript to compile them all into a single file that still has the functions needed by Bitwig defined at the top level of the file. This is why most of the code is enclosed in a dummy `_` namespace.

The source files are inside the `src` directory. The most important ones are:
- `src/script.ts` - Main entry point and configuration file. Here you can modify the "buttons" present in the interface of your Linnstrument and configure it using the existing modules. Easiest place to start changing things.
- `src/modules` - Defines the different modules. A simple example to see how they work is `src/modules/OverdubToggle.ts`. Creating new modules is the best way to add new functionality.
- `src/Controller.ts` - Defines the main behavior of the controller that sets it up and glues together all the modules. You will need to modify this to alter the base framework of the script.

You'll need to run this line for your changes to be bundled in the main `.js` file.

```
yarn watch
```
