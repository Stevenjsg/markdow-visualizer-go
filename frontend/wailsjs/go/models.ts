export namespace main {
	
	export class FileContent {
	    path: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new FileContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	    }
	}

}

export namespace settings {
	
	export class Settings {
	    theme: string;
	    lastOpenedFile: string;
	    windowWidth: number;
	    windowHeight: number;
	    wordWrap: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.lastOpenedFile = source["lastOpenedFile"];
	        this.windowWidth = source["windowWidth"];
	        this.windowHeight = source["windowHeight"];
	        this.wordWrap = source["wordWrap"];
	    }
	}

}

