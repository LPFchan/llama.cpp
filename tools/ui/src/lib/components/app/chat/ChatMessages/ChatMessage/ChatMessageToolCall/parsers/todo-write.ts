export interface TodoWriteItem {
	content: string;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export function parseTodoWriteResult(): TodoWriteItem[] {
	return [];
}
