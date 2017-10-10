import { MessageBotExtension } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'
import { RemovableMessageHelper } from './listeners'
import { MessageConfig } from './'

export abstract class MessagesTab<T> extends RemovableMessageHelper<T> {
    protected tab: HTMLDivElement
    protected ui: UIExtensionExports
    protected ex: MessageBotExtension

    protected root: HTMLDivElement
    protected template: HTMLTemplateElement

    abstract addMessage: (message?: Partial<T>) => void
    abstract insertHTML: () => void

    constructor({ name, ex, id }: { name: string, ex: MessageBotExtension, id: string }) {
        super(id, ex)
        this.ui = ex.bot.getExports('ui') as UIExtensionExports
        this.ex = ex
        this.tab = this.ui.addTab(name, 'messages')
    }

    setup = () => {
        this.insertHTML()
        this.template = this.tab.querySelector('template') as HTMLTemplateElement
        this.root = this.tab.querySelector('.messages-container') as HTMLDivElement

        // Auto save messages
        this.tab.addEventListener('input', () => this.save())
        // Create a new message
        let button = this.tab.querySelector('.button.is-primary') as HTMLElement
        button.addEventListener('click', () => {
            this.addMessage()
        })
        // Deleting messages
        this.tab.addEventListener('click', event => {
            let target = event.target as HTMLElement
            if (target.tagName == 'A' && target.textContent == 'Delete') {
                event.preventDefault()

                this.ui.alert(
                    'Really delete this message?',
                    [{ text: 'Delete', style: 'is-danger' }, { text: 'Cancel' }],
                    result => {
                        if (result != 'Delete') return

                        let parent = target
                        while (!parent.classList.contains('column')) {
                            parent = parent.parentElement as HTMLElement
                        }
                        parent.remove()
                        this.save()
                    }
                )
            }
        })

        this.ex.storage.get(this.id, [] as T[]).forEach(message => {
            this.addMessage(message)
        })
    }

    remove() {
        this.ui.removeTab(this.tab)
    }

    save() {
        this.ex.storage.set(this.id, this.getMessages())
    }

    getMessages = (): { [key: string]: string | number }[] => {
        let messages: { [key: string]: string | number }[] = []

        Array.from(this.root.children).forEach(element => {
            let data: { [key: string]: string | number } = {}

            Array.from(element.querySelectorAll('[data-target]')).forEach((input: HTMLElement) => {
                let name = input.dataset['target']
                if (!name) return

                switch (input.getAttribute('type')) {
                    case 'number':
                        data[name] = +(input as HTMLInputElement).value
                        break
                    default:
                        data[name] = (input as HTMLInputElement).value
                }
            })

            messages.push(data)
        })

        return messages
    }
}

import joinHtml from './includes/join.html'
export class JoinTab extends MessagesTab<MessageConfig> {
    constructor(ex: MessageBotExtension) {
        super({ name: 'Join', id: 'joinArr', ex })
    }

    insertHTML = () => {
        this.tab.innerHTML = joinHtml
    }

    addMessage = (msg: Partial<MessageConfig> = {}) => {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' },
        ])
    }
}

import leaveHtml from './includes/leave.html'
export class LeaveTab extends MessagesTab<MessageConfig> {
    constructor(ex: MessageBotExtension) {
        super({ name: 'Leave', id: 'leaveArr', ex })
    }

    insertHTML = () => {
        this.tab.innerHTML = leaveHtml
    }

    addMessage = (msg: Partial<MessageConfig> = {}) => {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ])
    }
}

import triggerHtml from './includes/trigger.html'
export class TriggerTab extends MessagesTab<MessageConfig & { trigger: string }> {
    constructor(ex: MessageBotExtension) {
        super({ name: 'Trigger', id: 'triggerArr', ex })
    }

    insertHTML = () => {
        this.tab.innerHTML = triggerHtml
    }

    addMessage = (msg: Partial<MessageConfig & { trigger: string }> = {}) => {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=trigger]', value: msg.trigger || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ])
    }
}

import annHtml from './includes/announcements.html'
export class AnnouncementTab extends MessagesTab<{ message: string }> {
    constructor(ex: MessageBotExtension) {
        super({ name: 'Announcements', id: 'announcementArr', ex })
    }

    insertHTML = () => {
        this.tab.innerHTML = annHtml
    }

    addMessage = (msg: Partial<{ message: string }> = {}) => {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
        ])
    }
}