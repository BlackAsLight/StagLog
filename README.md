# What Is This?
A simple package that prints to the console and saves said logs to a file. Logs are grouped by date. Older log files will be gzip, and log files created on the same day will be concatenated into one file labeled with said date. Using `closeLogger()` isn't required when quitting the application, but it is recommended.
# Installation
`npm i staglog`
```
import { log, level, closeLogger } from 'staglog';

// Example
log('Title', level.info, 'Hello World!');
closeLogger();
// Console Output: [YYYY-MM-DD-HH-MM-SS] [INFO/Title] Hello World!
```
## Options
In a `.env` file you can add boolean `DEBUG` and `VERBOSE` values to have certain stuff only get logged in development environments.
You can also change the default path, `./logs/`, the log files end up by adding `LOG_PATH` to the `.env` file.
If you have several projects with this package logging to the same folder then you can add `LOG_PREFIX` to `.env` to specify a bit of text in the log file name to differentiate between different projects.
## Warning
`closeLogger()` should only be used when the application is about to end. Once this function is run, at this time, the logger will no longer log to any file, but will continue to display to the terminal. 