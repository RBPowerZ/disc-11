import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { IQueueSong } from "../../typings";
import { createEmbed } from "../../utils/createEmbed";
import { play } from "../../utils/handlers/GeneralUtil";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@DefineCommand({
    aliases: ["st"],
    description: "Skip to specific position in the queue",
    name: "skipto",
    slash: {
        name: "skipto",
        options: [
            {
                description: "Rewind to the first song in the queue",
                name: "First",
                type: "SUB_COMMAND"
            },
            {
                description: "Skip to the last song in the queue",
                name: "Last",
                type: "SUB_COMMAND"
            },
            {
                description: "Position to skip to",
                name: "Position",
                type: "NUMBER"
            }
        ]
    },
    usage: "{prefix}skipto <\"first\"|\"last\"|number>"
})
export class SkipToCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        if (!ctx.isInteraction() && !ctx.args[0]) return ctx.reply({ embeds: [createEmbed("warn", `Invalid usage, please use **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information.`)] });

        const songs = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        const targetType = ctx.isInteraction() ? (ctx.options?.getSubcommand() ?? ctx.options?.getNumber("Position")) : ctx.args[0];
        if (!["first", "last"].includes(String(targetType).toLowerCase()) && (!isNaN(Number(targetType)) && !songs[Number(targetType) - 1])) return ctx.reply({ embeds: [createEmbed("error", "Unable to find song in that position.")] });

        let song: IQueueSong;
        if (String(targetType).toLowerCase() === "first") {
            song = songs[0];
        } else if (String(targetType).toLowerCase() === "last") {
            song = songs[songs.length - 1];
        } else {
            song = songs[Number(targetType) - 1];
        }

        if (song.key === ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key) return ctx.reply({ embeds: [createEmbed("error", "You can't skip to currently playing music.")] });

        void play(this.client, ctx.guild!, song.key);

        return ctx.reply({ embeds: [createEmbed("info", `⏭ **|** Skipped to **[${song.song.title}](${song.song.url})**`).setThumbnail(song.song.thumbnail)] });
    }
}