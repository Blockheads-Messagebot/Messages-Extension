import { MessageBot } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'
import { JoinListener, LeaveListener, TriggerListener, AnnouncementListener } from './listeners'
import { JoinTab, LeaveTab, TriggerTab, AnnouncementTab } from './tabs'
import css from './includes/style.css'

export type MessageGroupType = 'all' | 'staff' | 'mod' | 'admin' | 'owner' | 'nobody'

export interface MessageConfig {
    message: string
    joins_low: number
    joins_high: number
    group: MessageGroupType
    not_group: MessageGroupType
}

MessageBot.registerExtension('messages', function(ex, world) {
    let listeners: {remove: () => void}[] = []
    ex.remove = () => listeners.forEach(l => l.remove())

    let hasLoaded = false
    let delayLoad = () => {
        if (hasLoaded) return
        hasLoaded = true

        listeners = [{
            remove: () => clearTimeout(setTimeout(() => {
                listeners = [
                    new JoinListener(ex),
                    new LeaveListener(ex),
                    new TriggerListener(ex),
                    new AnnouncementListener(ex),
                ]
            }, 500))
        }]
    }

    world.onJoin.one(delayLoad)
    world.onLeave.one(delayLoad)
    world.onMessage.one(delayLoad)

    // Loaded in a browser?
    if (ex.bot.getExports('ui')) {
        let style = document.head.appendChild(document.createElement('style'))
        style.innerHTML = css

        let ui = ex.bot.getExports('ui') as UIExtensionExports
        ui.addTabGroup('Messages', 'messages')

        let tabs = [
            new JoinTab(ex),
            new LeaveTab(ex),
            new TriggerTab(ex),
            new AnnouncementTab(ex),
        ]

        tabs.forEach(tab => tab.setup())

        listeners = listeners.concat(
            ...tabs,
            { remove: () => style.remove() },
            { remove: () => ui.removeTabGroup('messages') }
        )
    }
})
