<script lang="ts">
	import type { DatabaseMessageExtra } from '$lib/types';

	interface Props {
		attachments?: DatabaseMessageExtra[];
	}

	let { attachments = [] }: Props = $props();
</script>

<aside class="bg-background h-full border-l p-4">
	<p class="text-muted-foreground text-sm">
		{attachments.length > 0 ? 'Artifact preview' : 'No artifact selected'}
	</p>
</aside>
