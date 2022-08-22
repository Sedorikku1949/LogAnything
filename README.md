# LogAnything

> LogAnything is a npm library that gives you a clearer console and a trace of the messages in it

## Example
> ```js
> const LogIt = require("../src/main");
> const { createServer } = require("http");
> 
> const Logger = new LogIt();
> 
> const server = createServer((req, res) => {
> 	res.writeHead(200, {
> 		"Content-Type": "plain/text"
> 	});
> 	
> 	res.end("Hello World!");
> 	
> 	Logger.ok("Request at /", "Http::Listener")
> })
> 
> server.listen(8000, () => Logger.log("Server is listenning", "Http::Listener", ["port: 8000", "state: ready"]));
> ```
> Terminal output:
> ```shell
> LOG [Http::Listener] Server is listenning (15:46)
>   | port: 8000
>   | state: ready
> OK [Http::Listener] Request at / (15:47)
> ```
> *Color is not visible*

## Options available :
> ```js
> /**
>   * @param {object} [options] Options for the module
>   * @param {number} [options.maxLogsFiles] Default maximum of file logs is 4
>   * @param {boolean} [options.log] If messages are saved or not in files
>   * @param {string} [options.logDir] The directory of the log files, default is `./ShellLogs`
>   */
> ```