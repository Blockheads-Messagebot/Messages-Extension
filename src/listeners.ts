import { MessageBotExtension, Player } from '@bhmb/bot'
import { MessageConfig } from './'
import { checkJoins, checkGroups } from './helpers'

const cooldowns = new WeakMap<MessageBotExtension, {
    rejoin: { name: string, time: number }[],
    trigger: { name: string, time: number }[]
}>()

export abstract class RemovableMessageHelper<T> {
    constructor(protected id: string, protected ex: MessageBotExtension) {
        if (!cooldowns.has(ex)) cooldowns.set(ex, { rejoin: [], trigger: [] })
    }

    get messages() {
        return this.ex.storage.get<T[]>(this.id, [])
    }

    onCooldown(player: Player, type: 'rejoin' | 'trigger', key: string, fallback: number): boolean {
        const cd = cooldowns.get(this.ex)![type].find(cd => cd.name === player.name)
        if (!cd) return false
        return cd.time + this.ex.storage.get(key, fallback) * 1000 > Date.now()
    }

    addCooldown(player: Player, type: 'rejoin' | 'trigger'): void {
        const cd = cooldowns.get(this.ex)![type]
        cd.unshift({ name: player.name, time: Date.now() })
        cd.length = Math.min(32, cd.length)
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
        if (this.onCooldown(player, 'rejoin', 'rejoinCooldown', 30)) return
        this.addCooldown(player, 'rejoin')

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
        if (this.onCooldown(player, 'rejoin', 'rejoinCooldown', 30)) return
        this.addCooldown(player, 'rejoin')

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
        if (this.onCooldown(player, 'trigger', 'triggerCooldown', 10)) return

        let responses = 0
        for (let msg of this.messages) {
            let checks = [
                checkJoins(player, msg),
                checkGroups(player, msg),
                this.triggerMatches(message, msg.trigger)
            ]
            if (checks.every(Boolean) && ++responses <= this.ex.storage.get('maxResponses', 3)) {
                this.addCooldown(player, 'trigger')
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
    private timeoutId: number | NodeJS.Timer
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
        if (!this.ex.world.online.length) {
            this.index = 0
        } else {
            const data = this.messages[this.index++]
            if (data && data.message) this.ex.bot.send(data.message)
        }

        this.timeoutId = setTimeout(this.run, this.delay)
    }

    remove() {
        // This will also work with Timer, but Typescript doesn't know that.
        clearTimeout(this.timeoutId as number)
    }
}
