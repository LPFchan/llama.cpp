<script lang="ts">
	import type { AgenticSection } from '$lib/utils';
	import ToolCallBlock from './ToolCallBlock.svelte';

	interface Props {
		section: AgenticSection;
		open: boolean;
		isStreaming: boolean;
		onToggle?: () => void;
	}

	let { section, open, isStreaming, onToggle }: Props = $props();
</script>

<ToolCallBlock {section} {open} {isStreaming} meta={null} title="Create artifact" {onToggle}>
	{#snippet children(_meta, _ctx)}
		<div class="text-muted-foreground text-sm">{section.toolResult ?? 'Creating artifact...'}</div>
	{/snippet}
</ToolCallBlock>
