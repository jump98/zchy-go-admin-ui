# go-admin-ui


## 学习文档
[go-admin](https://www.go-admin.pro/)
[vue](https://cn.vuejs.org/)
[element UI](https://element.eleme.cn/)
[JavaScript入门](https://liaoxuefeng.com/books/javascript/quick-start/if/index.html)
[ES6 入门](https://www.runoob.com/w3cnote/es6-tutorial.html)


## Vscode 扩展
- Prettier 
- Vetur 
- vscode-icons 

## vs Code 配置
```json
{
	// ----------------- 全局设置 -----------------
	"editor.tabSize": 2,
	"editor.formatOnSave": true,
	"editor.wordWrapColumn": 200,
	"editor.fontFamily": "JetBrains Mono, Consolas, 'Courier New', monospace",
	"editor.fontSize": 12,
	"editor.inlineSuggest.enabled": true,
	"editor.renderControlCharacters": true,
	"editor.largeFileOptimizations": false,
	"editor.suggestSelection": "first",
	"editor.insertSpaces": true,

	"files.exclude": {
		"**/*.meta": true,
		"**/.classpath": true,
		"**/.project": true,
		"**/.settings": true,
		"**/.factorypath": true,
		"**/.git": false
	},

	"workbench.startupEditor": "newUntitledFile",
	"workbench.iconTheme": "vscode-icons",
	"window.zoomLevel": 1,
	"explorer.confirmDelete": false,

	// ----------------- Prettier -----------------
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"prettier.printWidth": 200,
	"prettier.tabWidth": 2,
	"prettier.useTabs": true,
	"prettier.semi": true,
	"prettier.singleQuote": false,
	"prettier.trailingComma": "none",
	"prettier.bracketSpacing": true,
	"prettier.arrowParens": "avoid",
	"prettier.endOfLine": "auto",

	// ----------------- Code Actions -----------------
	"editor.codeActionsOnSave": {
		"source.fixAll": "explicit",
		"source.organizeImports": "explicit"
	},

	// ----------------- Go -----------------
	"[go]": {
		"editor.formatOnSave": true,
		"editor.defaultFormatter": "golang.go",
		"editor.codeActionsOnSave": {
			"source.organizeImports": "explicit",
			"source.fixAll": "explicit"
		}
	},

	// ----------------- JavaScript -----------------
	"[javascript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},

	// ----------------- Vue -----------------
	"[vue]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},

	// ----------------- TypeScript -----------------
	"[typescript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},

	// ----------------- JSON -----------------
	"[json]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},

	// ----------------- 其他 -----------------
	"git.suggestSmartCommit": false,
	"javascript.updateImportsOnFileMove.enabled": "always",
	"typescript.updateImportsOnFileMove.enabled": "always",
	"files.associations": {
		"*.go": "go"
	},
	"workbench.settings.applyToAllProfiles": [
	
	],
	"git.confirmSync": false
}

```