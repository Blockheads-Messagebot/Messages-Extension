import { MessageBotExtension } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'
import { RemovableMessageHelper } from './listeners'
import { MessageConfig } from './'

import dragula from 'dragula'

function getElementWithClass(className: string, element?: HTMLElement | null): HTMLElement | undefined {
    if (!element) return
    return element.classList.contains(className) ? element : getElementWithClass(className, element.parentElement)
}

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

    setup = async () => {
        this.insertHTML()
        this.template = this.tab.querySelector('template') as HTMLTemplateElement
        this.root = this.tab.querySelector('.messages-container') as HTMLDivElement

        // Auto save messages
        this.tab.addEventListener('input', () => this.save())
        // Create a new message
        let button = this.tab.querySelector('.button.is-primary') as HTMLElement
        button.addEventListener('click', () => this.addMessage())
        // Deleting messages
        this.tab.addEventListener('click', event => {
            const target = event.target as HTMLElement
            if (target.matches('[data-do=delete]')) {
                event.preventDefault()

                // Todo: Undo
                const row = getElementWithClass('box', target)
                if (!row) return
                row.remove()
            }
            this.save()
        })
        // Moving up / down
        const dragger = dragula([this.root], {
            moves(_el: HTMLElement, _container: HTMLElement, handle: HTMLElement) {
                return handle.classList.contains('drag')
            }
        })
        dragger.on('drop', () => this.save())
        dragger.on('drag', (el: HTMLElement) => {
            const details = el.querySelector('details') as HTMLElement & { open: boolean } | null
            if (details) details.open = false
        })

        this.ex.storage.get<T[]>(this.id, []).forEach(message => {
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

        this.root.querySelectorAll('.box').forEach(element => {
            let data: { [key: string]: string | number } = {}
            element.querySelectorAll('[data-target]').forEach((input: HTMLInputElement) => {
                let name = input.dataset['target']
                if (!name) return

                switch (input.getAttribute('type')) {
                    case 'number':
                        data[name] = +input.value
                        break
                    default:
                        data[name] = input.value
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
            { selector: '[data-for=message-trim]', text: msg.message || '' },
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
            { selector: '[data-for=message-trim]', text: msg.message || '' },
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
