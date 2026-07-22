import { AttachmentType } from '$lib/enums';
import type { DatabaseMessageExtra } from '$lib/types';
import type { AgenticSection } from './agentic';
import { parsePartialJsonArgs } from './parse-partial-json-args';
import { tryParseToolResultObject } from './tool-call-meta';

export type ArtifactToolMeta = {
	attachment?: DatabaseMessageExtra;
	artifactId?: string;
	name?: string;
	resultMessage?: string;
	errorMessage?: string;
};

function getArtifactSignature(attachment: DatabaseMessageExtra): string {
	if (attachment.artifactId) return `artifact:${attachment.artifactId}`;

	if (
		attachment.type === AttachmentType.TEXT ||
		attachment.type === AttachmentType.LEGACY_CONTEXT
	) {
		return `text:${attachment.name}:${attachment.size ?? 0}:${'content' in attachment ? attachment.content : ''}`;
	}

	if (attachment.type === AttachmentType.IMAGE && 'base64Url' in attachment) {
		return `image:${attachment.name}:${attachment.base64Url}`;
	}

	if (
		(attachment.type === AttachmentType.PDF ||
			attachment.type === AttachmentType.AUDIO ||
			attachment.type === AttachmentType.VIDEO) &&
		'base64Data' in attachment
	) {
		return `${attachment.type}:${attachment.name}:${attachment.base64Data}`;
	}

	return `${attachment.type}:${attachment.name}:${attachment.size ?? 0}`;
}

export function getArtifactAttachments(
	attachments: DatabaseMessageExtra[] = []
): DatabaseMessageExtra[] {
	return attachments.filter((attachment) => attachment.presentation === 'artifact');
}

export function dedupeArtifactAttachments(
	attachments: DatabaseMessageExtra[] = []
): DatabaseMessageExtra[] {
	const seen = new Set<string>();
	const unique: DatabaseMessageExtra[] = [];

	for (const attachment of getArtifactAttachments(attachments)) {
		const signature = getArtifactSignature(attachment);
		if (seen.has(signature)) continue;

		seen.add(signature);
		unique.push(attachment);
	}

	return unique;
}

export function getArtifactAttachmentKey(
	messageId: string,
	attachment: DatabaseMessageExtra,
	index: number
): string {
	return `${messageId}:${getArtifactSignature(attachment)}:${index}`;
}

export function parseArtifactToolMeta(section: AgenticSection): ArtifactToolMeta {
	const args = section.toolArgs ? parsePartialJsonArgs(section.toolArgs) : null;
	const result = tryParseToolResultObject(section.toolResult);
	const attachments = dedupeArtifactAttachments(section.toolResultExtras);
	const attachment = attachments.at(-1);
	const argumentName = typeof args?.name === 'string' ? args.name : undefined;
	const argumentArtifactId = typeof args?.artifact_id === 'string' ? args.artifact_id : undefined;
	const errorMessage = typeof result?.error === 'string' ? result.error : undefined;

	return {
		attachment,
		artifactId: attachment?.artifactId ?? argumentArtifactId,
		name: attachment?.name ?? argumentName,
		resultMessage: errorMessage ? undefined : section.toolResult,
		errorMessage
	};
}
