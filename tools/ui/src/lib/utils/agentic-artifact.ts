import type { DatabaseMessageExtra } from '$lib/types';

export function getArtifactAttachments(
	attachments: DatabaseMessageExtra[]
): DatabaseMessageExtra[] {
	return attachments.filter((attachment) => attachment.presentation === 'artifact');
}
