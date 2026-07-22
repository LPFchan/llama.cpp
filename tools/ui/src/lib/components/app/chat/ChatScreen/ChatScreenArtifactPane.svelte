<script lang="ts">
	import { Download, FileText, Image as ImageIcon, X } from '@lucide/svelte';
	import { MarkdownContent, SyntaxHighlightedCode } from '$lib/components/app';
	import { Button } from '$lib/components/ui/button';
	import { AttachmentType } from '$lib/enums';
	import type { DatabaseMessageExtra } from '$lib/types';
	import {
		createBase64DataUrl,
		formatFileSize,
		getFileTypeLabel,
		getLanguageFromFilename
	} from '$lib/utils';

	interface Props {
		attachment: DatabaseMessageExtra | null;
		onClose?: () => void;
	}

	let { attachment, onClose }: Props = $props();

	function getMimeType(item: DatabaseMessageExtra): string {
		if (item.mimeType) return item.mimeType;
		if (item.type === AttachmentType.TEXT) return 'text/plain';
		if (item.type === AttachmentType.PDF) return 'application/pdf';
		if (item.type === AttachmentType.IMAGE) return 'image';
		return String(item.type).toLowerCase();
	}

	function getTextContent(item: DatabaseMessageExtra): string | null {
		if ('content' in item && typeof item.content === 'string') return item.content;
		return null;
	}

	function getImageUrl(item: DatabaseMessageExtra): string | null {
		if (item.type === AttachmentType.IMAGE && 'base64Url' in item) return item.base64Url;
		return null;
	}

	function getBinaryUrl(item: DatabaseMessageExtra): string | null {
		if (item.type === AttachmentType.IMAGE && 'base64Url' in item) return item.base64Url;
		if (item.type === AttachmentType.TEXT && 'content' in item) {
			return `data:${getMimeType(item)};charset=utf-8,${encodeURIComponent(item.content)}`;
		}
		if (item.type === AttachmentType.PDF && 'base64Data' in item) {
			return createBase64DataUrl('application/pdf', item.base64Data);
		}
		if (
			(item.type === AttachmentType.AUDIO || item.type === AttachmentType.VIDEO) &&
			'base64Data' in item &&
			item.mimeType
		) {
			return createBase64DataUrl(item.mimeType, item.base64Data);
		}
		return null;
	}
</script>

{#if attachment}
	{@const mimeType = getMimeType(attachment)}
	{@const textContent = getTextContent(attachment)}
	{@const imageUrl = getImageUrl(attachment)}
	{@const binaryUrl = getBinaryUrl(attachment)}
	{@const size = attachment.size != null ? formatFileSize(attachment.size) : ''}

	<aside class="artifact-pane" aria-label="Artifact preview">
		<header class="artifact-header">
			<div class="flex min-w-0 items-center gap-3">
				<div
					class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
				>
					{#if imageUrl}
						<ImageIcon class="h-4 w-4" />
					{:else}
						<FileText class="h-4 w-4" />
					{/if}
				</div>

				<div class="min-w-0">
					<div class="truncate text-sm font-medium">{attachment.name}</div>
					<div class="text-muted-foreground mt-0.5 text-xs">
						{getFileTypeLabel(mimeType)}{size ? ` / ${size}` : ''}
					</div>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<Button
					aria-label="Download artifact"
					class="h-8 px-2"
					disabled={!binaryUrl}
					href={binaryUrl ?? undefined}
					download={attachment.name}
					size="sm"
					variant="outline"
				>
					<Download class="h-4 w-4" />
					<span class="hidden sm:inline">Download</span>
				</Button>

				<Button
					aria-label="Close artifact preview"
					class="h-8 w-8 p-0"
					onclick={onClose}
					size="sm"
					variant="ghost"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>
		</header>

		<div class="artifact-body">
			{#if textContent !== null}
				{#if mimeType === 'text/markdown'}
					<div class="artifact-document">
						<MarkdownContent class="markdown-artifact -my-4 text-sm" content={textContent} />
					</div>
				{:else}
					<SyntaxHighlightedCode
						class="artifact-code"
						code={textContent}
						language={getLanguageFromFilename(attachment.name)}
						maxHeight="none"
					/>
				{/if}
			{:else if imageUrl}
				<img
					class="mx-auto max-h-full max-w-full object-contain"
					src={imageUrl}
					alt={attachment.name}
				/>
			{:else if attachment.type === AttachmentType.PDF && binaryUrl}
				<iframe
					class="border-border h-full min-h-[32rem] w-full rounded-md border"
					src={binaryUrl}
					title={attachment.name}
				></iframe>
			{:else if attachment.type === AttachmentType.AUDIO && binaryUrl}
				<audio class="w-full" controls src={binaryUrl}></audio>
			{:else if attachment.type === AttachmentType.VIDEO && binaryUrl}
				<video class="max-h-full w-full" controls src={binaryUrl}>
					<track kind="captions" />
				</video>
			{:else}
				<div class="border-border bg-muted text-muted-foreground rounded-md border p-4 text-sm">
					Preview is not available for this artifact type. Use Download to inspect it.
				</div>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.artifact-pane {
		display: flex;
		height: 100%;
		min-width: 0;
		flex-direction: column;
		border-left: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--foreground));
	}

	.artifact-header {
		display: flex;
		min-height: 4rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid hsl(var(--border));
		padding: 0.75rem 1rem;
	}

	.artifact-body {
		min-height: 0;
		flex: 1;
		overflow: auto;
		padding: 1rem;
	}

	.artifact-document {
		max-width: 48rem;
		border-radius: 0.5rem;
		background: hsl(var(--card));
		padding: 1rem;
	}

	.artifact-body :global(.artifact-code pre),
	.artifact-body :global(.artifact-code code) {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
</style>
