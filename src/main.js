const { inspect } = require("util");
const { mkdirSync ,existsSync, statSync, createWriteStream, readdirSync, unlinkSync } = require("fs");
const path = require("path");

class LogIt {
	/**
	 * @param {object} [options] Options for the module
	 * @param {number} [options.maxLogsFiles] Default maximum of file logs is 4
	 * @param {boolean} [options.log] If messages are saved or not in files
	 * @param {string} [options.logDir]
	 */
	constructor(options = {}) {
		this.options = options;
		
		// maxLogsFiles
		if ("maxLogsFiles" in options && !isNaN(options.maxLogsFiles)){
			if (Number(options.maxLogsFiles) - 1 > 0) throw new Error("wait, how can i save logs if the maximum of logs files is zero ?")
			this.maxLogsFiles = Number(options.maxLogsFiles) - 1;
		} else this.maxLogsFiles = 4;
		
		// log files
		if (("log" in options) && options["log"]){
			// use file log
			this.__initLogs(options["logDir"]);
		}
	}
	
	/**
	 * @return {boolean}
	 * @private
	 */
	__clearLogs(){
		const files = readdirSync(this.logsDir)
				.map((f) => ({ dir: `${this.logsDir}${path.sep}${f}`, name: f, statSync: statSync(`${this.logsDir}${path.sep}${f}`) }))
				.sort((a, b) => b.statSync.mtime.getTime() - a.statSync.mtime.getTime());
		
		if (files.length >= this.maxLogsFiles){
			// clear
			let keeps = files.slice(0, this.maxLogsFiles);
			files.forEach(({ dir }) => {
				if (!keeps.some((k) => k.dir === dir)) unlinkSync(dir);
			})
			return true;
		} else return true;
	}
	
	/**
	 * @param {string} dir
	 * @private
	 */
	__initLogs(dir){
		if (dir){
			// dir was provided in options
			if (typeof dir !== "string" || !path.resolve(dir) || !existsSync(path.resolve(dir)) || !statSync(dir).isDirectory()) throw new Error("Invalid directory was provided ! Please provide a valid folder");
			this.logsDir = path.resolve(dir);
			
			// clear logs
			this.__clearLogs();
			
			this.logFileName = `logs_${(new Date()).toLocaleString().replace(/\s+|,\s*|:|\//g, "_")}`;
			this.logFileDir = this.logsDir + path.sep + this.logFileName;
		} else {
			// default folder
			// folder Name:
			//	       	ShellLogs
			const d = process.cwd() + path.sep + "ShellLogs"
			if (!existsSync(d) || !statSync(d).isDirectory()) mkdirSync(d);
			this.logsDir = d;
			
			// clear logs
			this.__clearLogs();
			
			this.logFileName = `logs_${(new Date()).toLocaleString().replace(/\s+|,\s*|:|\//g, "_")}`;
			this.logFileDir = this.logsDir + path.sep + this.logFileName;
		}
		
		this.stdoutStream = createWriteStream(this.logFileDir, { flags: "a",  encoding: "utf-8",  autoClose: true });
		this.stdoutStream.on("error", (err) => console.error(err));
		this.stdoutStream.write(`[HEADER]\nCWD = ${process.cwd()}\nTHIS_DIR = ${this.logFileDir}\nSTART_TIMESTAMP = ${Date.now()}\nSTART_UTC = ${new Date()}\nOPTIONS = ${inspect(this.options || {}, { colors: false }).replace(/\s*\n\s*/g, "")}\n\n[BODY]\n\n`)
	}
	
	// >>--->> PRIVATE PROPERTIES <<---<<
	// edit this functions at your risk, they can cause errors if they are edited !
	
	/**
	 * @param {string} start
	 * @param {any} data
	 * @param {string} footer
	 * @param {boolean} [resolveDataType]
	 * @param {string|boolean} [dataColor]
	 * @param {boolean} ignoreStringType
	 * @private
	 *
	 * @return {Error|void}
	 */
	__send(start, data, footer, resolveDataType = false, dataColor = false, ignoreStringType = true){
		if (typeof start !== "string" || typeof footer !== "string") throw new Error("Cannot send data");
		const content = `\x1b[0m${start}${(/\s$/).test(start) ? "" : " "}${resolveDataType && (ignoreStringType ? typeof data !== "string" : true) ? `\x1b[2m${data?.constructor?.name}\x1b[0m ` : ""}${dataColor ? dataColor : ""}${typeof data == "string" ? data : inspect(data, { colors: false }) }${dataColor ? dataColor : ""}${footer}\x1b[0m`;
		console.log(content);
		this.stdoutStream.write(`${this.__decolor(content.trim())}\n`)
	}
	/**
	 * @param {string|array} source
	 * @param {boolean|string} colors
	 * @return {string}
	 * @private
	 */
	__resolveSource(source, colors = true) {
		return source ? (`${colors ? (typeof colors == "string" ? colors : "\x1b[33m") : ""}[${(Array.isArray(source) ? source.join(" ") : source)}]\x1b[0m `) : ""
	}
	/**
	 * @param {boolean} addWhitespace
	 * @return {string}
	 * @private
	 */
	__resolveDate(addWhitespace = true){
		const d = new Date();
		return `\x1b[0m${addWhitespace ? " " : ""}\x1b[2m(${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")})\x1b[0m`
	}
	/**
	 * @param {string} data
	 * @return {*}
	 */
	__decolor(data){
		if (typeof data !== "string") return data;
		return data.replace(/\x1B\[\d{1,2}m/g, "");
	}
	/**
	 * @param {*} details
	 * @param {boolean} resolveType
	 * @param {string} start
	 * @param {number} __i
	 * @private
	 */
	__sendDetail(details, resolveType = true, start = "  |", __i = 0) {
		if (Array.isArray(details)) {
			if (details.length < 1) return;
			if (__i > 0) this.__send(`\x1b[2m${start}\x1b[0m`, `\x1b[2m${details?.constructor?.name}\x1b[0m`, " \x1b[2m↵\x1b[0m", false, false, true);
			details.map((d) => this.__sendDetail(d, resolveType, start + (__i < 1 ? '' : '  |'), __i + 1));
		}
		else this.__send(`\x1b[2m${start}\x1b[0m`, details, "", (resolveType && details?.constructor?.name ? resolveType : false), "\x1b[2m", true);
	}
	
	
	// >>--->> NON-PRIVATE PROPERTIES <<---<<
	
	
	ok(data, source, otherData = null){
		this.__send(`\x1b[32mOK\x1b[0m ${this.__resolveSource(source)}`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0)
	}
	
	log(data, source, otherData = null){
		this.__send(`\x1b[34mLOG\x1b[0m ${this.__resolveSource(source)}`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0)
	}
	
	info(data, source, otherData = null){
		this.__send(`\x1b[36mINFO\x1b[0m ${this.__resolveSource(source)}`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0)
	}
	
	warn(data, source, otherData = null){
		this.__send(`\x1b[33mWARN\x1b[0m ${this.__resolveSource(source, "\x1b[34m")}`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0)
	}
	
	error(data, source, otherData = null){
		this.__send(`\x1b[31mERROR\x1b[0m ${this.__resolveSource(source)}`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0)
	}
	
	panic(data, source, otherData = null){
		this.__send(`\n\x1b[31mPANIC!!\x1b[0m ${this.__resolveSource(source, "\x1b[31m")}`, this.__decolor(data), this.__resolveDate(true), true, "\x1b[31m", true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0);
		process.stdout.write("\n");
	}
	
	debug(name, data, otherData = null){
		this.__send(`\x1b[34mDEBUG\x1b[0m \x1b[2m${name}\x1b[0m --`, this.__decolor(data), this.__resolveDate(true), true, false, true)
		if (otherData) this.__sendDetail(otherData, true, "  |", 0);
	}
}

module.exports = LogIt;