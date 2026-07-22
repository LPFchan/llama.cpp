export type TodoWriteStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TodoWriteItem {
	content: string;
	status: TodoWriteStatus;
}

export interface TodoWriteMeta {
	todos: TodoWriteItem[];
	errorMessage?: string;
}

const VALID_STATUSES = new Set<TodoWriteStatus>([
	'pending',
	'in_progress',
	'completed',
	'cancelled'
]);

function normalizeTodo(value: unknown): TodoWriteItem | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

	const item = value as Record<string, unknown>;
	const content = typeof item.content === 'string' ? item.content.trim() : '';
	if (!content) return null;

	const status =
		typeof item.status === 'string' && VALID_STATUSES.has(item.status as TodoWriteStatus)
			? (item.status as TodoWriteStatus)
			: 'pending';

	return { content, status };
}

function normalizeTodos(value: unknown): TodoWriteItem[] {
	if (!Array.isArray(value)) return [];
	return value.map(normalizeTodo).filter((todo): todo is TodoWriteItem => todo !== null);
}

export function parseTodoWriteMeta(result: string | unknown[] | undefined): TodoWriteMeta {
	if (result == null || result === '') return { todos: [] };

	let parsed: unknown;
	try {
		parsed = typeof result === 'string' ? JSON.parse(result) : result;
	} catch {
		return { todos: [] };
	}

	if (Array.isArray(parsed)) return { todos: normalizeTodos(parsed) };
	if (!parsed || typeof parsed !== 'object') return { todos: [] };

	const response = parsed as Record<string, unknown>;
	if (typeof response.error === 'string') {
		return { todos: [], errorMessage: response.error };
	}
	if (typeof response.plain_text_response !== 'string') return { todos: [] };

	try {
		return { todos: normalizeTodos(JSON.parse(response.plain_text_response)) };
	} catch {
		return { todos: [] };
	}
}

export function parseTodoWriteResult(result: string | unknown[] | undefined): TodoWriteItem[] {
	return parseTodoWriteMeta(result).todos;
}
