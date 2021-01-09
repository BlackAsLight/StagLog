# What Is This?
A simply logger package for logging console input to a file.

# Installation
`npm i staglog`
## Options
In a `.env` file you can add boolean `DEBUG` and `VERBOSE` values to have certain stuff only get logged in development environments.
You can also change the default path, `./logs/`, the log files end up by adding `LOG_PATH` to the `.env` file.
If you have several projects with this package logging to the same folder then you can add `LOG_PREFIX` to `.env` to specify a bit of text in the log file name to differentiate between different projects.