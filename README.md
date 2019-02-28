# Messages-Extension

This extension provides basic support for messages for the Blockheads MessageBot.

Configuration keys (stored in the extension storage object)

| Key | Description | Default |
| ------ | ------ | ------ |
| `maxResponses` | The maximum number of triggers to respond to at once. | `3` |
| `disableWhitespaceTrimming` | If the trigger should be trimmed before testing. | `false` |
| `regexTriggers` | If triggers should be parsed as regex. | `false` |
| `announcementDelay` | The delay between sending announcements. | `10` |
| `disableJoinDelay` | If the player leaves and rejoins within this many seconds, don't re-send join messages. | `30` |
| `disableLeaveDelay` | If the player leaves more than once within this many seconds, don't re-send leave messages. | `30` |
| `disableTriggerDelay` | Ignore messages from players for this many seconds after a trigger. | `10` |

Note: This package must be included in a module bundler to work correctly in the browser.
