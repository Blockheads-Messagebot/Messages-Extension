import { MessageConfig, MessageGroupType } from './'
import { Player } from '@bhmb/bot'

export function checkJoins(player: Player, message: MessageConfig) {
    return player.joins >= message.joins_low && player.joins <= message.joins_high
}

export function checkGroups(player: Player, message: MessageConfig): boolean {
    return isInGroup(player, message.group) && !isInGroup(player, message.not_group)
}

function isInGroup(player: Player, group: MessageGroupType): boolean {
    switch (group) {
        case 'all':
            return true
        case 'staff':
            return player.isStaff
        case 'mod':
            return player.isMod
        case 'admin':
            return player.isAdmin
        case 'owner':
            return player.isOwner
        default:
            return false
    }
}