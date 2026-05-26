import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { ensureDir } from '@std/fs';

import commands from './commands.json' with { type: 'json' };

interface CommandChoice {
	name: string;
	value: string | number;
}

interface CommandOption {
	name: string;
	description: string;
	type: number;
	required?: boolean;
	choices?: CommandChoice[];
	options?: CommandOption[];
	channel_types?: number[];
}

interface Command {
	name?: string;
	description: string;
	category?: string;
	type?: string;
	slash?: boolean | string;
	testOnly?: boolean;
	guildOnly?: boolean;
	ownerOnly?: boolean;
	options?: CommandOption[];
	permissions?: string[];
	minArgs?: number;
	maxArgs?: number;
	expectedArgs?: string;
}

const commandPageTemplate = Deno.readTextFileSync('./template.mdx');

function escapeCurlyBraces(text: string): string {
	return text.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

async function handlePage(command: Command): Promise<void> {
	if (!command.name) return console.warn('Command without name found, skipping.');
	if (command.ownerOnly) return console.log(`Skipping owner-only command: ${command.name}`);
	if (command.testOnly) return console.log(`Skipping test-only command: ${command.name}`);
	console.log(`Handling page for command: ${command.name}`);

	let pageContent = commandPageTemplate;
	const capitalizedName = command.name.split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join('');
	pageContent = pageContent.replaceAll('{name}', capitalizedName);
	pageContent = pageContent.replace('{description}', escapeCurlyBraces(command.description));
	pageContent = pageContent.replace('{category}', command.category || 'Unknown');
	pageContent = pageContent.replace('{name_lowercase}', command.name.toLowerCase());

	pageContent += handleCommand(command, undefined, command.permissions);

	const categoryFolder = command.category || 'Uncategorized';
	await ensureDir(`../src/content/docs/commands/${categoryFolder}`);
	try {
		await Deno.writeTextFile(`../src/content/docs/commands/${categoryFolder}/${command.name}.mdx`, pageContent, {
			createNew: true
		});
	} catch (error) {
		if (error instanceof Deno.errors.AlreadyExists) {
			console.log(`File for command ${command.name} already exists, skipping write.`);
		} else {
			throw error;
		}
	}
}

function handleCommand(command: Command | CommandOption, history: string[] = [], inheritedPermissions?: string[]): string {
	console.log(`Command: ${command.name}`);

	const hasSubcommands = command.options && command.options[0] &&
		(command.options[0].type === ApplicationCommandOptionType.Subcommand ||
			command.options[0].type === ApplicationCommandOptionType.SubcommandGroup);

	if (hasSubcommands) {
		let output = '';
		const perms = ('permissions' in command && command.permissions) ? command.permissions as string[] : inheritedPermissions;
		command.options!.forEach(subCmd => {
			console.log(`  Subcommand: ${subCmd.name}`);
			output += handleCommand(subCmd, command.name ? [...history, command.name] : history, perms);
		});
		return output;
	}

	const fullPath = [...history, command.name].join(' ');

	// filter out subcommand types from the regular params list
	const regularParams = command.options?.filter(opt =>
		opt.type !== ApplicationCommandOptionType.Subcommand &&
		opt.type !== ApplicationCommandOptionType.SubcommandGroup
	);

	const permissions = ('permissions' in command && command.permissions)
		? command.permissions as string[]
		: inheritedPermissions;

	return `
## /${fullPath}
${escapeCurlyBraces(command.description)}

<Command>
${regularParams && regularParams.length > 0 ? `	<div slot="params">
		Parameter|Type|Description|Required|Choices
		---|---|---|---|---
		${regularParams.map(opt => {
		const choices = ('choices' in opt && opt.choices) ? (opt.choices as unknown as Array<{ name: string }>).map((choice) => escapeCurlyBraces(choice.name)).join(', ') : 'N/A';
		return `${escapeCurlyBraces(opt.name)}|${ApplicationCommandOptionType[opt.type]}|${escapeCurlyBraces(opt.description)}|${'required' in opt && opt.required ? 'Yes' : 'No'}|${choices}`;
	}).join('\n\t\t')}
	</div>

` : ''}${permissions ? `	<div slot="permissions">
		${permissions.map(perm => {
			// permissions are stored as bigint strings

		const permName = Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits] === permBigInt);
		const prettyName = permName ? permName.split(/(?=[A-Z])/).join(' ') : 'Unknown Permission';
		return `* You need the **${prettyName}** permission to run this command.`;
	}).join('\n\t\t')}
	</div>
` : ''}</Command>`;
}

commands.forEach(cmd => {
	handlePage(cmd);
});