import { MessageBotExtension, Player } from '@bhmb/bot'
import { MessageConfig } from './'
import { checkJoins, checkGroups } from './helpers'

export abstract class RemovableMessageHelper<T> {
    constructor(protected id: string, protected ex: MessageBotExtension) { }

    get messages() {
        return this.ex.storage.get<T[]>(this.id, [])
    }

    abstract remove(): void
}

export class JoinListener extends RemovableMessageHelper<MessageConfig> {
    constructor(ex: MessageBotExtension) {
        super('joinArr', ex)
        this.ex.world.onJoin.sub(this.listener)
    }

    remove() {
        this.ex.world.onJoin.unsub(this.listener)
    }

    listener = (player: Player) => {
        for (let msg of this.messages) {
            if (checkJoins(player, msg) && checkGroups(player, msg)) {
                this.ex.bot.send(msg.message, { name: player.name })
            }
        }
    }
}

export class LeaveListener extends RemovableMessageHelper<MessageConfig> {
    constructor(ex: MessageBotExtension) {
        super('leaveArr', ex)
        this.ex.world.onLeave.sub(this.listener)
    }

    remove() {
        this.ex.world.onLeave.unsub(this.listener)
    }

    listener = (player: Player) => {
        for (let msg of this.messages) {
            if (checkJoins(player, msg) && checkGroups(player, msg)) {
                this.ex.bot.send(msg.message, { name: player.name })
            }
        }
    }
}

export class TriggerListener extends RemovableMessageHelper<MessageConfig & { trigger: string }> {
    constructor(ex: MessageBotExtension) {
        super('triggerArr', ex)
        this.ex.world.onMessage.sub(this.listener)
    }

    remove() {
        this.ex.world.onMessage.unsub(this.listener)
    }

    listener = ({ player, message }: { player: Player, message: string }) => {
        if (player.name == 'SERVER') return
        let responses = 0
        for (let msg of this.messages) {
            let checks = [
                checkJoins(player, msg),
                checkGroups(player, msg),
                this.triggerMatches(message, msg.trigger)
            ]
            if (checks.every(Boolean) && ++responses <= this.ex.storage.get('maxResponses', 3)) {
                this.ex.bot.send(msg.message, { name: player.name })
            }
        }
    }

    triggerMatches(message: string, trigger: string): boolean {
        if (!this.ex.storage.get('disableWhitespaceTrimming', false)) {
            trigger = trigger.trim()
        }
        if (this.ex.storage.get('regexTriggers', false)) {
            try {
                return new RegExp(trigger, 'i').test(message)
            } catch {
                return false
            }
        }

        trigger = trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*")
        return new RegExp(trigger, 'i').test(message)
    }
}

export class AnnouncementListener extends RemovableMessageHelper<{ message: string }> {
    private timeoutId: number
    private index = 0

    get delay() {
        return this.ex.storage.get('announcementDelay', 10) * 60000
    }

    constructor(ex: MessageBotExtension) {
        super('announcementArr', ex)
        this.timeoutId = setTimeout(this.run, this.delay)
    }

    run = () => {
        if (this.index >= this.messages.length) this.index = 0

        if (this.messages[this.index]) this.ex.bot.send(this.messages[this.index++].message)

        this.timeoutId = setTimeout(this.run, this.delay)
    }

    remove() {
        clearTimeout(this.timeoutId)
    }
}
