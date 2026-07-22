<script lang="ts">
	import { FileText, Image as ImageIcon, XCircle } from '@lucide/svelte';
	import { AttachmentType } from '$lib/enums';
	import { formatFileSize, getFileTypeLabel, type AgenticSection } from '$lib/utils';
	import { getArtifactAttachmentKey, parseArtifactToolMeta } from '$lib/utils/agentic-artifact';
	import ToolCallBlock from './ToolCallBlock.svelte';

	interface Props {
		section: AgenticSection;
		open: boolean;
		isStreaming: boolean;
		onToggle?: () => void;
	}

	let { section, open, isStreaming, onToggle }: Props = $props();

	const artifactMeta = $derived(parseArtifactToolMeta(section));

	function openArtifact() {
		if (!artifactMeta.attachment) return;

		window.dispatchEvent(
			new CustomEvent('agentic-artifact-open', {
				detail: {
					key: getArtifactAttachmentKey(section.toolCallId ?? '', artifactMeta.attachment, 0),
					attachment: artifactMeta.attachment
				}
			})
		);
	}
</script>

<ToolCallBlock {section} {open} {isStreaming} meta={artifactMeta} {onToggle}>
	{#snippet titleSnippet()}
		<span class="text-muted-foreground">Create artifact</span>
		{#if artifactMeta.name}
			<span class="truncate font-mono">{artifactMeta.name}</span>
		{/if}
	{/snippet}

	{#snippet children(meta, ctx)}
		{#if meta?.errorMessage}
			<div
				class="flex items-start gap-2 rounded bg-red-500/10 p-2 text-xs italic text-red-600 dark:text-red-400"
			>
				<XCircle class="mt-0.5 h-3 w-3 shrink-0" />
				<span>{meta.errorMessage}</span>
			</div>
		{:else if meta?.attachment}
			<button
				type="button"
				class="bg-card hover:bg-accent/35 focus-visible:outline-ring flex w-full min-w-0 items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
				onclick={openArtifact}
			>
				<span class="flex min-w-0 items-center gap-3">
					<span
						class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
					>
						{#if meta.attachment.type === AttachmentType.IMAGE}
							<ImageIcon class="h-4 w-4" />
						{:else}
							<FileText class="h-4 w-4" />
						{/if}
					</span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium">{meta.attachment.name}</span>
						<span class="text-muted-foreground block text-xs">
							{getFileTypeLabel(meta.attachment.mimeType ?? meta.attachment.type)}
							{#if meta.attachment.size != null}
								<span class="px-1">/</span>{formatFileSize(meta.attachment.size)}
							{/if}
						</span>
					</span>
				</span>
				<span class="text-muted-foreground shrink-0 text-xs">Open preview</span>
			</button>
		{:else if ctx.isCodeStreaming || !section.toolResult}
			<div class="bg-muted/20 text-muted-foreground/70 rounded p-2 text-xs italic">
				Creating artifact...
			</div>
		{:else if meta?.resultMessage}
			<div class="text-muted-foreground text-sm">{meta.resultMessage}</div>
		{/if}
	{/snippet}
</ToolCallBlock>
