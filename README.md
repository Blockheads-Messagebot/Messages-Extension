# Messages-Extension

This extension provides basic support for messages for the Blockheads MessageBot.

Configuration keys (stored in the extension storage object)

| Key | Description | Default |
| ------ | ------ | ------ |
| `maxResponses` | The maximum number of triggers to respond to at once. | `3` |
| `disableWhitespaceTrimming` | If the trigger should be trimmed before testing. | `false` |
| `regexTriggers` | If triggers should be parsed as regex. | `false` |
| `announcementDelay` | The delay between sending announcements. | `10` |

Note: This package must be included in a module bundler to work correctly in the browser. 
