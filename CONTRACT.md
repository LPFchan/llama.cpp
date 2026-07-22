# Agentic built-in tools contract

This document defines the shared server and frontend interfaces consumed by the Wave 2 leaf implementations.

## Interactive request rail

`AgenticInteractiveRequest` is a discriminated union:

```ts
type AgenticInteractiveRequest =
	| {
			kind: 'permission';
			toolName: string;
			serverLabel: string;
	  }
	| {
			kind: 'question';
			toolName: 'question';
			requestID: string;
			questions: AgenticQuestionPrompt[];
	  };
```

The shared resolver accepts either an ordinary permission decision or question answers:

```ts
type AgenticQuestionAnswers = string[][];
type AgenticInteractiveResolution = ToolPermissionDecision | AgenticQuestionAnswers;

agenticResolvePermission(
	conversationId: string,
	resolution: AgenticInteractiveResolution
): void;
```

Each outer array entry corresponds to the question at the same index. Each inner array contains the selected labels and/or custom answer for that question. Slice Q submits answers through `agenticResolvePermission(conversationId, answers)`. Dismissal uses `ToolPermissionDecision.DENY`.

Question calls do not show the ordinary allow/deny card. The flow is:

1. The model calls `question` with `questions`.
2. `POST /tools` returns `status: "awaiting_user"` with a request ID and the questions.
3. The agentic store publishes a `kind: "question"` interactive request and pauses on the shared resolver.
4. The question action card resolves with `string[][]` answers or `ToolPermissionDecision.DENY`.
5. The agentic store calls `POST /tools` again with the original arguments, `request_id`, and either `answers` or `rejected: true`.
6. The completed response becomes the normal tool-result message and the agentic loop continues.

No question-specific server endpoint is used.

## Structured attachment rail

`ToolsService.executeTool()` preserves these optional server response fields:

```ts
interface ToolExecutionResult {
	content: string;
	isError: boolean;
	attachments?: DatabaseMessageExtra[];
	artifactId?: string;
}
```

The agentic store merges `attachments` with attachments extracted from plain text and passes the combined list to the tool-result database message, `onAttachments`, and multimodal session history.

Every database attachment extra supports:

```ts
type AgenticAttachmentPresentation = 'artifact' | 'file';

interface DatabaseMessageExtraBase {
	presentation?: AgenticAttachmentPresentation;
	artifactId?: string;
	mimeType?: string;
}
```

Artifact responses set `presentation: "artifact"` and `artifactId` on their attachment.

The common attachment fields are:

```json
{
  "name": "document.txt",
  "size": 12,
  "artifactId": "artifact-<unique-id>",
  "presentation": "artifact",
  "mimeType": "text/plain"
}
```

The MIME-specific fields are:

- Text: `{"type":"TEXT","content":"..."}`
- Image: `{"type":"IMAGE","base64Url":"data:<mime>;base64,<data>"}`
- PDF: `{"type":"PDF","base64Data":"<data>","content":"","processedAsImages":false}`
- Audio: `{"type":"AUDIO","base64Data":"<data>"}`
- Video: `{"type":"VIDEO","base64Data":"<data>"}`

## question

Enum value:

```ts
BuiltInTool.QUESTION = 'question'
```

Initial result:

```json
{
  "status": "awaiting_user",
  "kind": "question",
  "request_id": "question-<unique-id>",
  "payload": {
    "request_id": "question-<unique-id>",
    "questions": [
      {
        "question": "Complete question",
        "header": "Short label",
        "options": [
          {"label": "Choice", "description": "Choice explanation"}
        ],
        "multiple": false,
        "custom": true
      }
    ]
  }
}
```

Answered result:

```json
{
  "status": "completed",
  "plain_text_response": "User has answered your questions: \"<question>\"=\"<answers>\". You can now continue with the user's answers in mind."
}
```

Dismissed result:

```json
{
  "status": "completed",
  "plain_text_response": "The user dismissed this question.",
  "is_error": true
}
```

Validation failures return `{"error":"<message>"}`.

Slice Q replaces:

- `tools/ui/src/lib/components/app/chat/ChatMessages/ChatMessage/ChatMessageToolCall/ChatMessageToolCallBlockQuestion.svelte`
- `tools/ui/src/lib/components/app/chat/ChatMessages/ChatMessage/ChatMessageToolCall/parsers/question.ts`
- `tools/ui/src/lib/components/app/chat/ChatMessages/ChatMessageActions/ChatMessageActionCard/ChatMessageActionCardQuestionRequest.svelte`

## artifact_create

Enum value:

```ts
BuiltInTool.ARTIFACT_CREATE = 'artifact_create'
```

Completed result:

```json
{
  "status": "completed",
  "plain_text_response": "Created artifact <artifact-id>: <name>",
  "artifact_id": "<artifact-id>",
  "attachments": [
    {
      "type": "TEXT",
      "name": "<name>",
      "size": 12,
      "artifactId": "<artifact-id>",
      "presentation": "artifact",
      "mimeType": "text/plain",
      "content": "<content>"
    }
  ]
}
```

Validation failures return `{"error":"<message>"}`.

Slice A replaces:

- `tools/ui/src/lib/components/app/chat/ChatMessages/ChatMessage/ChatMessageToolCall/ChatMessageToolCallBlockArtifactCreate.svelte`

## artifact_edit

Enum value:

```ts
BuiltInTool.ARTIFACT_EDIT = 'artifact_edit'
```

Completed result:

```json
{
  "status": "completed",
  "plain_text_response": "Edited artifact <artifact-id>: <name>",
  "artifact_id": "<artifact-id>",
  "attachments": [
    {
      "type": "TEXT",
      "name": "<name>",
      "size": 12,
      "artifactId": "<artifact-id>",
      "presentation": "artifact",
      "mimeType": "text/plain",
      "content": "<content>"
    }
  ]
}
```

Unknown artifact IDs and validation failures return `{"error":"<message>"}`. Artifact state is mutex-protected, keyed by `artifact_id`, and scoped to the server process lifetime.

Slice A replaces:

- `tools/ui/src/lib/components/app/chat/ChatMessages/ChatMessage/ChatMessageToolCall/ChatMessageToolCallBlockArtifactEdit.svelte`
- `tools/ui/src/lib/components/app/chat/ChatScreen/ChatScreenArtifactPane.svelte`
- `tools/ui/src/lib/utils/agentic-artifact.ts`
