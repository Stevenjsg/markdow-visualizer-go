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
	export class StartupFile {
	    path: string;
	    content: string;
	    isNew: boolean;
	
	    static createFrom(source: any = {}) {
	        return new StartupFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	        this.isNew = source["isNew"];
	    }
	}

}

export namespace settings {
	
	export class Settings {
	    theme: string;
	    lastOpenedFile: string;
	    windowWidth: number;
	    windowHeight: number;
	    windowX: number;
	    windowY: number;
	    windowMaximised: boolean;
	    wordWrap: boolean;
	    formatToolbar: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.lastOpenedFile = source["lastOpenedFile"];
	        this.windowWidth = source["windowWidth"];
	        this.windowHeight = source["windowHeight"];
	        this.windowX = source["windowX"];
	        this.windowY = source["windowY"];
	        this.windowMaximised = source["windowMaximised"];
	        this.wordWrap = source["wordWrap"];
	        this.formatToolbar = source["formatToolbar"];
	    }
	}

}

