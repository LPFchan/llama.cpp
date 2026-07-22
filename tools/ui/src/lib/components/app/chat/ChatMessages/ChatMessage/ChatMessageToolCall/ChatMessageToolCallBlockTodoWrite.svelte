<script lang="ts">
	import { CheckCircle2, Circle, Loader2, XCircle } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { AgenticSection } from '$lib/utils';
	import {
		parseTodoWriteMeta,
		type TodoWriteStatus
	} from './parsers/todo-write';
	import ToolCallBlock from './ToolCallBlock.svelte';

	interface Props {
		section: AgenticSection;
		open: boolean;
		isStreaming: boolean;
		onToggle?: () => void;
	}

	let { section, open, isStreaming, onToggle }: Props = $props();

	const todoMeta = $derived(parseTodoWriteMeta(section.toolResult));
	const completedCount = $derived(
		todoMeta.todos.filter((todo) => todo.status === 'completed').length
	);

	function statusIcon(status: TodoWriteStatus): Component {
		switch (status) {
			case 'completed':
				return CheckCircle2;
			case 'in_progress':
				return Loader2;
			case 'cancelled':
				return XCircle;
			default:
				return Circle;
		}
	}

	function statusClass(status: TodoWriteStatus): string {
		switch (status) {
			case 'completed':
				return 'text-green-600 dark:text-green-400';
			case 'in_progress':
				return 'text-blue-600 dark:text-blue-400';
			case 'cancelled':
				return 'text-destructive';
			default:
				return 'text-muted-foreground';
		}
	}
</script>

<ToolCallBlock {section} {open} {isStreaming} meta={todoMeta} title="Todo status" {onToggle}>
	{#snippet children(meta, ctx)}
		{#if ctx.isPending || (ctx.isStreamingCall && ctx.isStreaming)}
			<div class="rounded bg-muted/20 p-2 text-xs text-muted-foreground/70 italic">
				Updating todos...
			</div>
		{:else if meta?.errorMessage}
			<div
				class="flex items-start gap-2 rounded bg-red-500/10 p-2 text-xs text-red-600 italic dark:text-red-400"
			>
				<XCircle class="mt-0.5 h-3 w-3 shrink-0" />
				<span>{meta.errorMessage}</span>
			</div>
		{:else if meta && meta.todos.length > 0}
			<div class="mb-2 text-right text-xs text-muted-foreground">
				{completedCount}/{meta.todos.length} done
			</div>
			<div class="space-y-1.5">
				{#each meta.todos as todo, index (`${index}:${todo.content}`)}
					{@const Icon = statusIcon(todo.status)}
					<div class="flex items-start gap-2 rounded-md bg-muted/30 px-2 py-1.5">
						<Icon
							class={`mt-0.5 h-4 w-4 shrink-0 ${statusClass(todo.status)} ${todo.status === 'in_progress' ? 'animate-spin' : ''}`}
						/>
						<div class="min-w-0 flex-1">
							<div class="text-sm leading-5 break-words">{todo.content}</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded bg-muted/20 p-2 text-xs text-muted-foreground/70 italic">No todos</div>
		{/if}
	{/snippet}
</ToolCallBlock>
